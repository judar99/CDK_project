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

    const inventoryTable = new dynamodb.Table(this, "InventoryTable", {
      partitionKey: { name: "id", type: dynamodb.AttributeType.STRING },
    });

    //Lambda Funtions 

    const postFunction = new lambda.Function(this, "PostFuntion", {
      runtime: lambda.Runtime.PYTHON_3_7,
      handler: 'post.lambdaFuncion',
      code: lambda.Code.fromInline('def lambdaFuncion(event, context):\n    print("Hello World post")\n'),
      environment: {
        TABLE: inventoryTable.tableName,
      },
    });

    const createFunction = new lambda.Function(this, "CreateFunction", {
      runtime: lambda.Runtime.PYTHON_3_9,
      handler: 'index.lambdaFuncion',
      code: lambda.Code.fromInline('def lambdaFuncion(event, context):\n    print("Hello World delete")\n'),
      environment: {
        TABLE: inventoryTable.tableName,
      },
    });

    const deleteFunction = new lambda.Function(this, "DeleteFunction", {
      runtime: lambda.Runtime.PYTHON_3_9,
      handler: 'index.lambdaFuncion',
      code: lambda.Code.fromInline('def lambdaFuncion(event, context):\n    print("Hello World delete")\n'),
      environment: {
        TABLE: inventoryTable.tableName,
      },
    });

    //permiso para lambda
    inventoryTable.grantWriteData(postFunction);
    inventoryTable.grant(postFunction, "dynamodb:Scan");
    inventoryTable.grantReadWriteData(createFunction);
    inventoryTable.grantReadWriteData(deleteFunction);


    //APIgatway

    const inventoryAPI = new apigw.RestApi(this, "InventoryApi");

    inventoryAPI.root
      .resourceForPath("post")
      .addMethod("POST", new apigw.LambdaIntegration(postFunction))

      inventoryAPI.root
      .resourceForPath("create")
      .addMethod("POST", new apigw.LambdaIntegration(createFunction))

    inventoryAPI.root
      .resourceForPath("delete")
      .addMethod("POST", new apigw.LambdaIntegration(deleteFunction))


    // Creates a distribution from an S3 bucket.

    const myBucket = new s3.Bucket(this, 'inventoryBucket');
    const bucketImg = new s3.Bucket(this,"imgBucket")

    myBucket.addToResourcePolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: ['s3:GetObject'],
      principals: [new iam.AnyPrincipal()],
      resources: [myBucket.arnForObjects('*')],
    }));
   
    bucketImg.addToResourcePolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: ['s3:GetObject', 's3:DeleteObject'],
      principals: [new iam.AnyPrincipal()],
      resources: [bucketImg.arnForObjects('*')],
    }));

    const oai = new cloudfront.OriginAccessIdentity(this, 'myOAI');

    new cloudfront.Distribution(this, 'inventoryFront', {
      defaultBehavior: { 
        origin: new origins.S3Origin(myBucket, {
          originPath: '/html',
          originAccessIdentity: oai,
        })
      },
      defaultRootObject:'index.html'
    });
  }
  
}
