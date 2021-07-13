#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import { MyCustomResource } from '../lib/cdk-cr-bug-stack';

/**
 * A stack that sets up MyCustomResource and shows how to get an attribute from it
 */
 class MyStack extends cdk.Stack {
  constructor(scope: cdk.App, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    new MyCustomResource(this, 'DemoResource', {
      message: 'CustomResource says hello',
    });
  }
}

const app = new cdk.App();
new MyStack(app, 'CustomResourceDemoStack', { 
  env: { 
    account: process.env.CDK_DEFAULT_ACCOUNT, 
    region: process.env.CDK_DEFAULT_REGION 
}});
app.synth();