import cdk = require('@aws-cdk/core');
import iam = require('@aws-cdk/aws-iam');
import ec2 = require('@aws-cdk/aws-ec2')
import lambda = require('@aws-cdk/aws-lambda');
import { PythonFunction } from "@aws-cdk/aws-lambda-python";
import logs = require('@aws-cdk/aws-logs')
import cr = require('@aws-cdk/custom-resources');

import fs = require('fs');

export interface MyCustomResourceProps {
  /**
   * Message to echo
   */
  message: string;
}

export class MyCustomResource extends cdk.Construct {
  public readonly response: string;

  constructor(scope: cdk.Construct, id: string, props: MyCustomResourceProps) {
    super(scope, id);

    // const resource = new cfn.CustomResource(this, 'Resource', {
    //   provider: cfn.CustomResourceProvider.lambda(new lambda.SingletonFunction(this, 'Singleton', {
    //     uuid: 'f7d4f730-4ee1-11e8-9c2d-fa7ae01bbebc',
    //     code: new lambda.InlineCode(fs.readFileSync('lib/custom-resource-handler.py', { encoding: 'utf-8' })),
    //     handler: 'index.main',
    //     timeout: cdk.Duration.seconds(300),
    //     runtime: lambda.Runtime.PYTHON_3_6,
    //   })),
    //   properties: props
    // });

    // this.response = resource.getAtt('Response').toString();

    const vpc = ec2.Vpc.fromLookup(this, "lambda-VPC", {
      vpcId: "[VPC ID]"
    });
    const subnets = [ec2.Subnet.fromSubnetId(this, "lambda-subnet", "[Private subnet ID]")];
    const securityGroups = [ec2.SecurityGroup.fromSecurityGroupId(this, "inter-vpc-sg", "[Security group ID]")];
    
    const onEvent = new PythonFunction(this, 'MyHandler', {
      entry: 'lib/',
      index: 'custom-resource-handler.py',
      handler: 'main',
      runtime: lambda.Runtime.PYTHON_3_8,
      vpc: vpc,
      vpcSubnets: {subnets: subnets},
      securityGroups: securityGroups,
      allowPublicSubnet: true // Can set this value on a regular lambda!
    })
    
    const myRole = new iam.Role(this, 'MyRole', { 
      roleName: 'providerRole',
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
          iam.ManagedPolicy.fromAwsManagedPolicyName("service-role/AWSLambdaVPCAccessExecutionRole")
      ]
    });

    const myProvider = new cr.Provider(this, 'MyProvider', {
      onEventHandler: onEvent,
      logRetention: logs.RetentionDays.ONE_DAY,   // default is INFINITE
      role: myRole, // must be assumable by the `lambda.amazonaws.com` service principal
      vpc: vpc,
      vpcSubnets: {subnets: subnets},
      securityGroups: securityGroups,
      // allowPublicSubnet: true // Can't set this value on the provider lambda!
    });

    new cdk.CustomResource(this, 'Resource1', { serviceToken: myProvider.serviceToken });
  }
}