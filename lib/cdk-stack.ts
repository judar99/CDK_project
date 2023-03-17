import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as apigw from "aws-cdk-lib/aws-apigateway";
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as s3deploy from 'aws-cdk-lib/aws-s3-deployment';
const iam = require('aws-cdk-lib/aws-iam');
const path = require('path');
import * as s3 from "aws-cdk-lib/aws-s3";

export class CdkStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    //Dynamodb

    const noteTable = new dynamodb.Table(this, "NoteTable", {
      partitionKey: { name: "id", type: dynamodb.AttributeType.STRING },
    });

    //Lambda Funtions 

    const postFunction = new lambda.Function(this, "PostFuntion", {
      runtime: lambda.Runtime.NODEJS_14_X,
      handler: 'index.main',
      code: lambda.Code.fromInline('console.log("Hello World");'),
      environment: {
        TABLE: noteTable.tableName,
      },
    });

    const deleteFunction = new lambda.Function(this, "DeleteFunction", {
      runtime: lambda.Runtime.NODEJS_14_X,
      handler: 'index.main',
      code: lambda.Code.fromInline('console.log("Hello Worldd");'),
      environment: {
        TABLE: noteTable.tableName,
      },
    });

    //permiso para lambda

    noteTable.grantWriteData(postFunction);
    noteTable.grantReadWriteData(deleteFunction);


    //APIgatway

    const helloAPI = new apigw.RestApi(this, "helloApi");

    helloAPI.root
      .resourceForPath("post")
      .addMethod("POST", new apigw.LambdaIntegration(postFunction))

    helloAPI.root
      .resourceForPath("delete")
      .addMethod("DELETE", new apigw.LambdaIntegration(deleteFunction))


    // Creates a distribution from an S3 bucket.
    const myBucket = new s3.Bucket(this, 'myBucket');
    const oai = new cloudfront.OriginAccessIdentity(this, 'myOAI');

    myBucket.addToResourcePolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: ['s3:GetObject'],
      principals: [new iam.AnyPrincipal()],
      resources: [myBucket.arnForObjects('*')],
    }));
    
    new cloudfront.Distribution(this, 'myDist', {
      defaultBehavior: { 
        origin: new origins.S3Origin(myBucket, {
          originPath: '/xml',
          originAccessIdentity: oai,
        })
      },
      defaultRootObject:'index.html'
    });
  }

}
