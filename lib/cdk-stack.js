"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CdkStack = void 0;
const cdk = require("aws-cdk-lib");
const lambda = require("aws-cdk-lib/aws-lambda");
const dynamodb = require("aws-cdk-lib/aws-dynamodb");
const apigw = require("aws-cdk-lib/aws-apigateway");
const cloudfront = require("aws-cdk-lib/aws-cloudfront");
const s3 = require("aws-cdk-lib/aws-s3");
const cognito = require("aws-cdk-lib/aws-cognito");
const iam = require('aws-cdk-lib/aws-iam');
const path = require('path');
class CdkStack extends cdk.Stack {
    constructor(scope, id, props) {
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
            handler: 'create.lambdaFuncion',
            code: lambda.Code.fromInline('def lambdaFuncion(event, context):\n    print("Hello World create")\n'),
            environment: {
                TABLE: inventoryTable.tableName,
            },
        });
        const deleteFunction = new lambda.Function(this, "DeleteFunction", {
            runtime: lambda.Runtime.PYTHON_3_9,
            handler: 'delete.lambdaFuncion',
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
        const inventoryAPI = new apigw.RestApi(this, "InventoryApi", {
            defaultCorsPreflightOptions: {
                allowOrigins: apigw.Cors.ALL_ORIGINS,
                allowMethods: apigw.Cors.ALL_METHODS
            }
        });
        inventoryAPI.root
            .resourceForPath("post")
            .addMethod("POST", new apigw.LambdaIntegration(postFunction));
        inventoryAPI.root
            .resourceForPath("create")
            .addMethod("POST", new apigw.LambdaIntegration(createFunction));
        inventoryAPI.root
            .resourceForPath("delete")
            .addMethod("DELETE", new apigw.LambdaIntegration(deleteFunction));
        // Creates a distribution from an S3 bucket.
        const myBucket = new s3.Bucket(this, 'inventoryBucket');
        const bucketImg = new s3.Bucket(this, "imgBucket");
        myBucket.addToResourcePolicy(new iam.PolicyStatement({
            effect: iam.Effect.ALLOW,
            actions: ['s3:GetObject'],
            principals: [new iam.AnyPrincipal()],
            resources: [myBucket.arnForObjects('*')],
        }));
        bucketImg.addToResourcePolicy(new iam.PolicyStatement({
            effect: iam.Effect.ALLOW,
            actions: ['s3:GetObject', 's3:DeleteObject', 's3:PutObject', 's3:PutObjectAcl'],
            principals: [new iam.AnyPrincipal()],
            resources: [bucketImg.arnForObjects('*')],
        }));
        const oai = new cloudfront.OriginAccessIdentity(this, 'myOAI');
        const inventoryFront = new cloudfront.CloudFrontWebDistribution(this, 'inventoryFront', {
            originConfigs: [
                {
                    s3OriginSource: {
                        s3BucketSource: myBucket,
                        originPath: '/html',
                        originAccessIdentity: oai
                    },
                    behaviors: [
                        { isDefaultBehavior: true }
                    ]
                }
            ],
            defaultRootObject: 'index.html'
        });
        const userPool = new cognito.UserPool(this, 'UserPool', {
            userPoolName: 'myUserPoolName',
            selfSignUpEnabled: false,
            autoVerify: { email: true },
            signInAliases: { email: true },
            passwordPolicy: {
                minLength: 8,
                requireLowercase: true,
                requireDigits: true,
                requireSymbols: false,
                requireUppercase: true
            }
        });
        userPool.addDomain('MyUserPoolDomain', {
            cognitoDomain: {
                domainPrefix: 'my-app-auth'
            }
        });
        const userPoolClient = new cognito.UserPoolClient(this, 'UserPoolClient', {
            userPool: userPool,
            authFlows: {
                userPassword: true
            },
            preventUserExistenceErrors: true,
            generateSecret: false,
            supportedIdentityProviders: [
                cognito.UserPoolClientIdentityProvider.COGNITO
            ],
            oAuth: {
                flows: {
                    authorizationCodeGrant: true,
                    implicitCodeGrant: true
                },
                callbackUrls: [
                    'https://${inventoryFront.distributionDomainName}/oauth2/idpresponse'
                ],
                logoutUrls: [
                    'https://my-cloudfront-distribution.cloudfront.net/logout'
                ]
            }
        });
    }
}
exports.CdkStack = CdkStack;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2RrLXN0YWNrLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiY2RrLXN0YWNrLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUFBLG1DQUFtQztBQUVuQyxpREFBaUQ7QUFDakQscURBQXFEO0FBQ3JELG9EQUFvRDtBQUNwRCx5REFBeUQ7QUFJekQseUNBQXlDO0FBQ3pDLG1EQUFtRDtBQUNuRCxNQUFNLEdBQUcsR0FBRyxPQUFPLENBQUMscUJBQXFCLENBQUMsQ0FBQztBQUMzQyxNQUFNLElBQUksR0FBRyxPQUFPLENBQUMsTUFBTSxDQUFDLENBQUM7QUFHN0IsTUFBYSxRQUFTLFNBQVEsR0FBRyxDQUFDLEtBQUs7SUFDckMsWUFBWSxLQUFnQixFQUFFLEVBQVUsRUFBRSxLQUFzQjtRQUM5RCxLQUFLLENBQUMsS0FBSyxFQUFFLEVBQUUsRUFBRSxLQUFLLENBQUMsQ0FBQztRQUV4QixVQUFVO1FBRVYsTUFBTSxjQUFjLEdBQUcsSUFBSSxRQUFRLENBQUMsS0FBSyxDQUFDLElBQUksRUFBRSxnQkFBZ0IsRUFBRTtZQUNoRSxZQUFZLEVBQUUsRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRSxRQUFRLENBQUMsYUFBYSxDQUFDLE1BQU0sRUFBRTtTQUNsRSxDQUFDLENBQUM7UUFFSCxrQkFBa0I7UUFFbEIsTUFBTSxZQUFZLEdBQUcsSUFBSSxNQUFNLENBQUMsUUFBUSxDQUFDLElBQUksRUFBRSxhQUFhLEVBQUU7WUFDNUQsT0FBTyxFQUFFLE1BQU0sQ0FBQyxPQUFPLENBQUMsVUFBVTtZQUNsQyxPQUFPLEVBQUUsb0JBQW9CO1lBQzdCLElBQUksRUFBRSxNQUFNLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxxRUFBcUUsQ0FBQztZQUNuRyxXQUFXLEVBQUU7Z0JBQ1gsS0FBSyxFQUFFLGNBQWMsQ0FBQyxTQUFTO2FBQ2hDO1NBQ0YsQ0FBQyxDQUFDO1FBRUgsTUFBTSxjQUFjLEdBQUcsSUFBSSxNQUFNLENBQUMsUUFBUSxDQUFD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QUMsQ0FBQztRQUVILE1BQU0sY0FBYyxHQUFHLElBQUksT0FBTyxDQUFDLGNBQWMsQ0FBQyxJQUFJLEVBQUUsZ0JBQWdCLEVBQUU7WUFDeEUsUUFBUSxFQUFFLFFBQVE7WUFDbEIsU0FBUyxFQUFFO2dCQUNULFlBQVksRUFBRSxJQUFJO2FBQ25CO1lBQ0QsMEJBQTBCLEVBQUUsSUFBSTtZQUNoQyxjQUFjLEVBQUUsS0FBSztZQUNyQiwwQkFBMEIsRUFBRTtnQkFDMUIsT0FBTyxDQUFDLDhCQUE4QixDQUFDLE9BQU87YUFDL0M7WUFDRCxLQUFLLEVBQUU7Z0JBQ0wsS0FBSyxFQUFFO29CQUNMLHNCQUFzQixFQUFFLElBQUk7b0JBQzVCLGlCQUFpQixFQUFFLElBQUk7aUJBQ3hCO2dCQUNELFlBQVksRUFBRTtvQkFDWixxRUFBcUU7aUJBQ3RFO2dCQUNELFVBQVUsRUFBRTtvQkFDViwwREFBMEQ7aUJBQzNEO2FBQ0Y7U0FDRixDQUFDLENBQUM7SUFFTCxDQUFDO0NBRUY7QUF2SkQsNEJBdUpDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0ICogYXMgY2RrIGZyb20gJ2F3cy1jZGstbGliJztcbmltcG9ydCB7IENvbnN0cnVjdCB9IGZyb20gJ2NvbnN0cnVjdHMnO1xuaW1wb3J0ICogYXMgbGFtYmRhIGZyb20gXCJhd3MtY2RrLWxpYi9hd3MtbGFtYmRhXCI7XG5pbXBvcnQgKiBhcyBkeW5hbW9kYiBmcm9tIFwiYXdzLWNkay1saWIvYXdzLWR5bmFtb2RiXCI7XG5pbXBvcnQgKiBhcyBhcGlndyBmcm9tIFwiYXdzLWNkay1saWIvYXdzLWFwaWdhdGV3YXlcIjtcbmltcG9ydCAqIGFzIGNsb3VkZnJvbnQgZnJvbSAnYXdzLWNkay1saWIvYXdzLWNsb3VkZnJvbnQnO1xuaW1wb3J0ICogYXMgb3JpZ2lucyBmcm9tICdhd3MtY2RrLWxpYi9hd3MtY2xvdWRmcm9udC1vcmlnaW5zJztcbmltcG9ydCAqIGFzIHMzZGVwbG95IGZyb20gJ2F3cy1jZGstbGliL2F3cy1zMy1kZXBsb3ltZW50JztcbmltcG9ydCAqIGFzIGFwaWd3djIgZnJvbSBcImF3cy1jZGstbGliL2F3cy1hcGlnYXRld2F5djJcIjtcbmltcG9ydCAqIGFzIHMzIGZyb20gXCJhd3MtY2RrLWxpYi9hd3MtczNcIjtcbmltcG9ydCAqIGFzIGNvZ25pdG8gZnJvbSBcImF3cy1jZGstbGliL2F3cy1jb2duaXRvXCI7XG5jb25zdCBpYW0gPSByZXF1aXJlKCdhd3MtY2RrLWxpYi9hd3MtaWFtJyk7XG5jb25zdCBwYXRoID0gcmVxdWlyZSgncGF0aCcpO1xuXG5cbmV4cG9ydCBjbGFzcyBDZGtTdGFjayBleHRlbmRzIGNkay5TdGFjayB7XG4gIGNvbnN0cnVjdG9yKHNjb3BlOiBDb25zdHJ1Y3QsIGlkOiBzdHJpbmcsIHByb3BzPzogY2RrLlN0YWNrUHJvcHMpIHtcbiAgICBzdXBlcihzY29wZSwgaWQsIHByb3BzKTtcblxuICAgIC8vRHluYW1vZGJcblxuICAgIGNvbnN0IGludmVudG9yeVRhYmxlID0gbmV3IGR5bmFtb2RiLlRhYmxlKHRoaXMsIFwiSW52ZW50b3J5VGFibGVcIiwge1xuICAgICAgcGFydGl0aW9uS2V5OiB7IG5hbWU6IFwiaWRcIiwgdHlwZTogZHluYW1vZGIuQXR0cmlidXRlVHlwZS5TVFJJTkcgfSxcbiAgICB9KTtcblxuICAgIC8vTGFtYmRhIEZ1bnRpb25zIFxuXG4gICAgY29uc3QgcG9zdEZ1bmN0aW9uID0gbmV3IGxhbWJkYS5GdW5jdGlvbih0aGlzLCBcIlBvc3RGdW50aW9uXCIsIHtcbiAgICAgIHJ1bnRpbWU6IGxhbWJkYS5SdW50aW1lLlBZVEhPTl8zXzcsXG4gICAgICBoYW5kbGVyOiAncG9zdC5sYW1iZGFGdW5jaW9uJyxcbiAgICAgIGNvZGU6IGxhbWJkYS5Db2RlLmZyb21JbmxpbmUoJ2RlZiBsYW1iZGFGdW5jaW9uKGV2ZW50LCBjb250ZXh0KTpcXG4gICAgcHJpbnQoXCJIZWxsbyBXb3JsZCBwb3N0XCIpXFxuJyksXG4gICAgICBlbnZpcm9ubWVudDoge1xuICAgICAgICBUQUJMRTogaW52ZW50b3J5VGFibGUudGFibGVOYW1lLFxuICAgICAgfSxcbiAgICB9KTtcblxuICAgIGNvbnN0IGNyZWF0ZUZ1bmN0aW9uID0gbmV3IGxhbWJkYS5GdW5jdGlvbih0aGlzLCBcIkNyZWF0ZUZ1bmN0aW9uXCIsIHtcbiAgICAgIHJ1bnRpbWU6IGxhbWJkYS5SdW50aW1lLlBZVEhPTl8zXzksXG4gICAgICBoYW5kbGVyOiAnY3JlYXRlLmxhbWJkYUZ1bmNpb24nLFxuICAgICAgY29kZTogbGFtYmRhLkNvZGUuZnJvbUlubGluZSgnZGVmIGxhbWJkYUZ1bmNpb24oZXZlbnQsIGNvbnRleHQpOlxcbiAgICBwcmludChcIkhlbGxvIFdvcmxkIGNyZWF0ZVwiKVxcbicpLFxuICAgICAgZW52aXJvbm1lbnQ6IHtcbiAgICAgICAgVEFCTEU6IGludmVudG9yeVRhYmxlLnRhYmxlTmFtZSxcbiAgICAgIH0sXG4gICAgfSk7XG5cbiAgICBjb25zdCBkZWxldGVGdW5jdGlvbiA9IG5ldyBsYW1iZGEuRnVuY3Rpb24odGhpcywgXCJEZWxldGVGdW5jdGlvblwiLCB7XG4gICAgICBydW50aW1lOiBsYW1iZGEuUnVudGltZS5QWVRIT05fM185LFxuICAgICAgaGFuZGxlcjogJ2RlbGV0ZS5sYW1iZGFGdW5jaW9uJyxcbiAgICAgIGNvZGU6IGxhbWJkYS5Db2RlLmZyb21JbmxpbmUoJ2RlZiBsYW1iZGFGdW5jaW9uKGV2ZW50LCBjb250ZXh0KTpcXG4gICAgcHJpbnQoXCJIZWxsbyBXb3JsZCBkZWxldGVcIilcXG4nKSxcbiAgICAgIGVudmlyb25tZW50OiB7XG4gICAgICAgIFRBQkxFOiBpbnZlbnRvcnlUYWJsZS50YWJsZU5hbWUsXG4gICAgICB9LFxuICAgIH0pO1xuXG4gICAgLy9wZXJtaXNvIHBhcmEgbGFtYmRhXG4gICAgaW52ZW50b3J5VGFibGUuZ3JhbnRXcml0ZURhdGEocG9zdEZ1bmN0aW9uKTtcbiAgICBpbnZlbnRvcnlUYWJsZS5ncmFudChwb3N0RnVuY3Rpb24sIFwiZHluYW1vZGI6U2NhblwiKTtcbiAgICBpbnZlbnRvcnlUYWJsZS5ncmFudFJlYWRXcml0ZURhdGEoY3JlYXRlRnVuY3Rpb24pO1xuICAgIGludmVudG9yeVRhYmxlLmdyYW50UmVhZFdyaXRlRGF0YShkZWxldGVGdW5jdGlvbik7XG5cblxuICAgIC8vQVBJZ2F0d2F5XG5cbiAgICBjb25zdCBpbnZlbnRvcnlBUEkgPSBuZXcgYXBpZ3cuUmVzdEFwaSh0aGlzLCBcIkludmVudG9yeUFwaVwiLHtcbiAgICAgIGRlZmF1bHRDb3JzUHJlZmxpZ2h0T3B0aW9uczoge1xuICAgICAgICBhbGxvd09yaWdpbnM6IGFwaWd3LkNvcnMuQUxMX09SSUdJTlMsXG4gICAgICAgIGFsbG93TWV0aG9kczogYXBpZ3cuQ29ycy5BTExfTUVUSE9EU1xuICAgICAgfVxuICAgICAgfSk7XG5cbiAgICBpbnZlbnRvcnlBUEkucm9vdFxuICAgICAgLnJlc291cmNlRm9yUGF0aChcInBvc3RcIilcbiAgICAgIC5hZGRNZXRob2QoXCJQT1NUXCIsIG5ldyBhcGlndy5MYW1iZGFJbnRlZ3JhdGlvbihwb3N0RnVuY3Rpb24pKVxuXG4gICAgICBpbnZlbnRvcnlBUEkucm9vdFxuICAgICAgLnJlc291cmNlRm9yUGF0aChcImNyZWF0ZVwiKVxuICAgICAgLmFkZE1ldGhvZChcIlBPU1RcIiwgbmV3IGFwaWd3LkxhbWJkYUludGVncmF0aW9uKGNyZWF0ZUZ1bmN0aW9uKSlcblxuICAgIGludmVudG9yeUFQSS5yb290XG4gICAgICAucmVzb3VyY2VGb3JQYXRoKFwiZGVsZXRlXCIpXG4gICAgICAuYWRkTWV0aG9kKFwiREVMRVRFXCIsIG5ldyBhcGlndy5MYW1iZGFJbnRlZ3JhdGlvbihkZWxldGVGdW5jdGlvbikpXG5cblxuICAgIC8vIENyZWF0ZXMgYSBkaXN0cmlidXRpb24gZnJvbSBhbiBTMyBidWNrZXQuXG5cbiAgICBjb25zdCBteUJ1Y2tldCA9IG5ldyBzMy5CdWNrZXQodGhpcywgJ2ludmVudG9yeUJ1Y2tldCcpO1xuICAgIGNvbnN0IGJ1Y2tldEltZyA9IG5ldyBzMy5CdWNrZXQodGhpcyxcImltZ0J1Y2tldFwiKVxuXG4gICAgbXlCdWNrZXQuYWRkVG9SZXNvdXJjZVBvbGljeShuZXcgaWFtLlBvbGljeVN0YXRlbWVudCh7XG4gICAgICBlZmZlY3Q6IGlhbS5FZmZlY3QuQUxMT1csXG4gICAgICBhY3Rpb25zOiBbJ3MzOkdldE9iamVjdCddLFxuICAgICAgcHJpbmNpcGFsczogW25ldyBpYW0uQW55UHJpbmNpcGFsKCldLFxuICAgICAgcmVzb3VyY2VzOiBbbXlCdWNrZXQuYXJuRm9yT2JqZWN0cygnKicpXSxcbiAgICB9KSk7XG5cbiAgICBidWNrZXRJbWcuYWRkVG9SZXNvdXJjZVBvbGljeShuZXcgaWFtLlBvbGljeVN0YXRlbWVudCh7XG4gICAgICBlZmZlY3Q6IGlhbS5FZmZlY3QuQUxMT1csXG4gICAgICBhY3Rpb25zOiBbJ3MzOkdldE9iamVjdCcsICdzMzpEZWxldGVPYmplY3QnLCAnczM6UHV0T2JqZWN0JywgJ3MzOlB1dE9iamVjdEFjbCddLFxuICAgICAgcHJpbmNpcGFsczogW25ldyBpYW0uQW55UHJpbmNpcGFsKCldLFxuICAgICAgcmVzb3VyY2VzOiBbYnVja2V0SW1nLmFybkZvck9iamVjdHMoJyonKV0sXG4gICAgfSkpO1xuICAgIFxuICAgIGNvbnN0IG9haSA9IG5ldyBjbG91ZGZyb250Lk9yaWdpbkFjY2Vzc0lkZW50aXR5KHRoaXMsICdteU9BSScpO1xuXG4gICAgY29uc3QgaW52ZW50b3J5RnJvbnQgPSBuZXcgY2xvdWRmcm9udC5DbG91ZEZyb250V2ViRGlzdHJpYnV0aW9uKHRoaXMsICdpbnZlbnRvcnlGcm9udCcsIHtcbiAgICAgIG9yaWdpbkNvbmZpZ3M6IFtcbiAgICAgICAge1xuICAgICAgICAgIHMzT3JpZ2luU291cmNlOiB7XG4gICAgICAgICAgICBzM0J1Y2tldFNvdXJjZTogbXlCdWNrZXQsXG4gICAgICAgICAgICBvcmlnaW5QYXRoOiAnL2h0bWwnLFxuICAgICAgICAgICAgb3JpZ2luQWNjZXNzSWRlbnRpdHk6IG9haVxuICAgICAgICAgIH0sXG4gICAgICAgICAgYmVoYXZpb3JzOiBbXG4gICAgICAgICAgICB7IGlzRGVmYXVsdEJlaGF2aW9yOiB0cnVlIH1cbiAgICAgICAgICBdXG4gICAgICAgIH1cbiAgICAgIF0sXG4gICAgICBkZWZhdWx0Um9vdE9iamVjdDogJ2luZGV4Lmh0bWwnXG4gICAgfSk7XG5cbiAgICBjb25zdCB1c2VyUG9vbCA9IG5ldyBjb2duaXRvLlVzZXJQb29sKHRoaXMsICdVc2VyUG9vbCcsIHtcbiAgICAgIHVzZXJQb29sTmFtZTogJ215VXNlclBvb2xOYW1lJyxcbiAgICAgIHNlbGZTaWduVXBFbmFibGVkOiBmYWxzZSwgLy8gUGFyYSBkZXNoYWJpbGl0YXIgZWwgcmVnaXN0cm8gZGUgdXN1YXJpb3NcbiAgICAgIGF1dG9WZXJpZnk6IHsgZW1haWw6IHRydWUgfSwgLy8gUGFyYSB2ZXJpZmljYXIgYXV0b23DoXRpY2FtZW50ZSBsYSBkaXJlY2Npw7NuIGRlIGNvcnJlbyBlbGVjdHLDs25pY28gZGUgbG9zIHVzdWFyaW9zXG4gICAgICBzaWduSW5BbGlhc2VzOiB7IGVtYWlsOiB0cnVlIH0sIC8vIFBhcmEgcGVybWl0aXIgcXVlIGxvcyB1c3VhcmlvcyBpbmljaWVuIHNlc2nDs24gY29uIHN1IGNvcnJlbyBlbGVjdHLDs25pY29cbiAgICAgIHBhc3N3b3JkUG9saWN5OiB7XG4gICAgICAgIG1pbkxlbmd0aDogOCxcbiAgICAgICAgcmVxdWlyZUxvd2VyY2FzZTogdHJ1ZSxcbiAgICAgICAgcmVxdWlyZURpZ2l0czogdHJ1ZSxcbiAgICAgICAgcmVxdWlyZVN5bWJvbHM6IGZhbHNlLFxuICAgICAgICByZXF1aXJlVXBwZXJjYXNlOiB0cnVlXG4gICAgICB9XG4gICAgfSk7XG4gICAgXG4gICAgdXNlclBvb2wuYWRkRG9tYWluKCdNeVVzZXJQb29sRG9tYWluJywge1xuICAgICAgY29nbml0b0RvbWFpbjoge1xuICAgICAgICBkb21haW5QcmVmaXg6ICdteS1hcHAtYXV0aCdcbiAgICAgIH1cbiAgICB9KTtcblxuICAgIGNvbnN0IHVzZXJQb29sQ2xpZW50ID0gbmV3IGNvZ25pdG8uVXNlclBvb2xDbGllbnQodGhpcywgJ1VzZXJQb29sQ2xpZW50Jywge1xuICAgICAgdXNlclBvb2w6IHVzZXJQb29sLFxuICAgICAgYXV0aEZsb3dzOiB7IFxuICAgICAgICB1c2VyUGFzc3dvcmQ6IHRydWUgXG4gICAgICB9LFxuICAgICAgcHJldmVudFVzZXJFeGlzdGVuY2VFcnJvcnM6IHRydWUsXG4gICAgICBnZW5lcmF0ZVNlY3JldDogZmFsc2UsXG4gICAgICBzdXBwb3J0ZWRJZGVudGl0eVByb3ZpZGVyczogW1xuICAgICAgICBjb2duaXRvLlVzZXJQb29sQ2xpZW50SWRlbnRpdHlQcm92aWRlci5DT0dOSVRPXG4gICAgICBdLFxuICAgICAgb0F1dGg6IHtcbiAgICAgICAgZmxvd3M6IHtcbiAgICAgICAgICBhdXRob3JpemF0aW9uQ29kZUdyYW50OiB0cnVlLFxuICAgICAgICAgIGltcGxpY2l0Q29kZUdyYW50OiB0cnVlXG4gICAgICAgIH0sXG4gICAgICAgIGNhbGxiYWNrVXJsczogW1xuICAgICAgICAgICdodHRwczovLyR7aW52ZW50b3J5RnJvbnQuZGlzdHJpYnV0aW9uRG9tYWluTmFtZX0vb2F1dGgyL2lkcHJlc3BvbnNlJ1xuICAgICAgICBdLFxuICAgICAgICBsb2dvdXRVcmxzOiBbXG4gICAgICAgICAgJ2h0dHBzOi8vbXktY2xvdWRmcm9udC1kaXN0cmlidXRpb24uY2xvdWRmcm9udC5uZXQvbG9nb3V0J1xuICAgICAgICBdXG4gICAgICB9XG4gICAgfSk7XG5cbiAgfVxuICBcbn1cbiJdfQ==