#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';

import PipelineConstruct from '../lib/eks-blueprints-pipeline-test-stack';

const app = new cdk.App();

const account = process.env.CDK_DEFAULT_ACCOUNT;
const region = process.env.CDK_DEFAULT_REGION;
const props = { env: { account, region } };
const id = 'pipeline-cluster';

new PipelineConstruct(app, id, props);
