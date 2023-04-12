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
                    `https://${inventoryFront.distributionDomainName}/oauth2/idpresponse`
                ],
                logoutUrls: [
                    'https://my-cloudfront-distribution.cloudfront.net/logout'
                ]
            }
        });
    }
}
exports.CdkStack = CdkStack;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2RrLXN0YWNrLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiY2RrLXN0YWNrLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUFBLG1DQUFtQztBQUVuQyxpREFBaUQ7QUFDakQscURBQXFEO0FBQ3JELG9EQUFvRDtBQUNwRCx5REFBeUQ7QUFJekQseUNBQXlDO0FBQ3pDLG1EQUFtRDtBQUNuRCxNQUFNLEdBQUcsR0FBRyxPQUFPLENBQUMscUJBQXFCLENBQUMsQ0FBQztBQUMzQyxNQUFNLElBQUksR0FBRyxPQUFPLENBQUMsTUFBTSxDQUFDLENBQUM7QUFHN0IsTUFBYSxRQUFTLFNBQVEsR0FBRyxDQUFDLEtBQUs7SUFDckMsWUFBWSxLQUFnQixFQUFFLEVBQVUsRUFBRSxLQUFzQjtRQUM5RCxLQUFLLENBQUMsS0FBSyxFQUFFLEVBQUUsRUFBRSxLQUFLLENBQUMsQ0FBQztRQUV4QixVQUFVO1FBRVYsTUFBTSxjQUFjLEdBQUcsSUFBSSxRQUFRLENBQUMsS0FBSyxDQUFDLElBQUksRUFBRSxnQkFBZ0IsRUFBRTtZQUNoRSxZQUFZLEVBQUUsRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRSxRQUFRLENBQUMsYUFBYSxDQUFDLE1BQU0sRUFBRTtTQUNsRSxDQUFDLENBQUM7UUFFSCxrQkFBa0I7UUFFbEIsTUFBTSxZQUFZLEdBQUcsSUFBSSxNQUFNLENBQUMsUUFBUSxDQUFDLElBQUksRUFBRSxhQUFhLEVBQUU7WUFDNUQsT0FBTyxFQUFFLE1BQU0sQ0FBQyxPQUFPLENBQUMsVUFBVTtZQUNsQyxPQUFPLEVBQUUsb0JBQW9CO1lBQzdCLElBQUksRUFBRSxNQUFNLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxxRUFBcUUsQ0FBQztZQUNuRyxXQUFXLEVBQUU7Z0JBQ1gsS0FBSyxFQUFFLGNBQWMsQ0FBQyxTQUFTO2FBQ2hDO1NBQ0YsQ0FBQyxDQUFDO1FBRUgsTUFBTSxjQUFjLEdBQUcsSUFBSSxNQUFNLENBQUMsUUFBUSxDQUFD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QUMsQ0FBQztRQUVILE1BQU0sY0FBYyxHQUFHLElBQUksT0FBTyxDQUFDLGNBQWMsQ0FBQyxJQUFJLEVBQUUsZ0JBQWdCLEVBQUU7WUFDeEUsUUFBUSxFQUFFLFFBQVE7WUFDbEIsU0FBUyxFQUFFO2dCQUNULFlBQVksRUFBRSxJQUFJO2FBQ25CO1lBQ0QsMEJBQTBCLEVBQUUsSUFBSTtZQUNoQyxjQUFjLEVBQUUsS0FBSztZQUNyQiwwQkFBMEIsRUFBRTtnQkFDMUIsT0FBTyxDQUFDLDhCQUE4QixDQUFDLE9BQU87YUFDL0M7WUFDRCxLQUFLLEVBQUU7Z0JBQ0wsS0FBSyxFQUFFO29CQUNMLHNCQUFzQixFQUFFLElBQUk7b0JBQzVCLGlCQUFpQixFQUFFLElBQUk7aUJBQ3hCO2dCQUNELFlBQVksRUFBRTtvQkFDWixXQUFXLGNBQWMsQ0FBQyxzQkFBc0IscUJBQXFCO2lCQUN0RTtnQkFDRCxVQUFVLEVBQUU7b0JBQ1YsMERBQTBEO2lCQUMzRDthQUNGO1NBQ0YsQ0FBQyxDQUFDO0lBRUwsQ0FBQztDQUVGO0FBdkpELDRCQXVKQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIGNkayBmcm9tICdhd3MtY2RrLWxpYic7XG5pbXBvcnQgeyBDb25zdHJ1Y3QgfSBmcm9tICdjb25zdHJ1Y3RzJztcbmltcG9ydCAqIGFzIGxhbWJkYSBmcm9tIFwiYXdzLWNkay1saWIvYXdzLWxhbWJkYVwiO1xuaW1wb3J0ICogYXMgZHluYW1vZGIgZnJvbSBcImF3cy1jZGstbGliL2F3cy1keW5hbW9kYlwiO1xuaW1wb3J0ICogYXMgYXBpZ3cgZnJvbSBcImF3cy1jZGstbGliL2F3cy1hcGlnYXRld2F5XCI7XG5pbXBvcnQgKiBhcyBjbG91ZGZyb250IGZyb20gJ2F3cy1jZGstbGliL2F3cy1jbG91ZGZyb250JztcbmltcG9ydCAqIGFzIG9yaWdpbnMgZnJvbSAnYXdzLWNkay1saWIvYXdzLWNsb3VkZnJvbnQtb3JpZ2lucyc7XG5pbXBvcnQgKiBhcyBzM2RlcGxveSBmcm9tICdhd3MtY2RrLWxpYi9hd3MtczMtZGVwbG95bWVudCc7XG5pbXBvcnQgKiBhcyBhcGlnd3YyIGZyb20gXCJhd3MtY2RrLWxpYi9hd3MtYXBpZ2F0ZXdheXYyXCI7XG5pbXBvcnQgKiBhcyBzMyBmcm9tIFwiYXdzLWNkay1saWIvYXdzLXMzXCI7XG5pbXBvcnQgKiBhcyBjb2duaXRvIGZyb20gXCJhd3MtY2RrLWxpYi9hd3MtY29nbml0b1wiO1xuY29uc3QgaWFtID0gcmVxdWlyZSgnYXdzLWNkay1saWIvYXdzLWlhbScpO1xuY29uc3QgcGF0aCA9IHJlcXVpcmUoJ3BhdGgnKTtcblxuXG5leHBvcnQgY2xhc3MgQ2RrU3RhY2sgZXh0ZW5kcyBjZGsuU3RhY2sge1xuICBjb25zdHJ1Y3RvcihzY29wZTogQ29uc3RydWN0LCBpZDogc3RyaW5nLCBwcm9wcz86IGNkay5TdGFja1Byb3BzKSB7XG4gICAgc3VwZXIoc2NvcGUsIGlkLCBwcm9wcyk7XG5cbiAgICAvL0R5bmFtb2RiXG5cbiAgICBjb25zdCBpbnZlbnRvcnlUYWJsZSA9IG5ldyBkeW5hbW9kYi5UYWJsZSh0aGlzLCBcIkludmVudG9yeVRhYmxlXCIsIHtcbiAgICAgIHBhcnRpdGlvbktleTogeyBuYW1lOiBcImlkXCIsIHR5cGU6IGR5bmFtb2RiLkF0dHJpYnV0ZVR5cGUuU1RSSU5HIH0sXG4gICAgfSk7XG5cbiAgICAvL0xhbWJkYSBGdW50aW9ucyBcblxuICAgIGNvbnN0IHBvc3RGdW5jdGlvbiA9IG5ldyBsYW1iZGEuRnVuY3Rpb24odGhpcywgXCJQb3N0RnVudGlvblwiLCB7XG4gICAgICBydW50aW1lOiBsYW1iZGEuUnVudGltZS5QWVRIT05fM183LFxuICAgICAgaGFuZGxlcjogJ3Bvc3QubGFtYmRhRnVuY2lvbicsXG4gICAgICBjb2RlOiBsYW1iZGEuQ29kZS5mcm9tSW5saW5lKCdkZWYgbGFtYmRhRnVuY2lvbihldmVudCwgY29udGV4dCk6XFxuICAgIHByaW50KFwiSGVsbG8gV29ybGQgcG9zdFwiKVxcbicpLFxuICAgICAgZW52aXJvbm1lbnQ6IHtcbiAgICAgICAgVEFCTEU6IGludmVudG9yeVRhYmxlLnRhYmxlTmFtZSxcbiAgICAgIH0sXG4gICAgfSk7XG5cbiAgICBjb25zdCBjcmVhdGVGdW5jdGlvbiA9IG5ldyBsYW1iZGEuRnVuY3Rpb24odGhpcywgXCJDcmVhdGVGdW5jdGlvblwiLCB7XG4gICAgICBydW50aW1lOiBsYW1iZGEuUnVudGltZS5QWVRIT05fM185LFxuICAgICAgaGFuZGxlcjogJ2NyZWF0ZS5sYW1iZGFGdW5jaW9uJyxcbiAgICAgIGNvZGU6IGxhbWJkYS5Db2RlLmZyb21JbmxpbmUoJ2RlZiBsYW1iZGFGdW5jaW9uKGV2ZW50LCBjb250ZXh0KTpcXG4gICAgcHJpbnQoXCJIZWxsbyBXb3JsZCBjcmVhdGVcIilcXG4nKSxcbiAgICAgIGVudmlyb25tZW50OiB7XG4gICAgICAgIFRBQkxFOiBpbnZlbnRvcnlUYWJsZS50YWJsZU5hbWUsXG4gICAgICB9LFxuICAgIH0pO1xuXG4gICAgY29uc3QgZGVsZXRlRnVuY3Rpb24gPSBuZXcgbGFtYmRhLkZ1bmN0aW9uKHRoaXMsIFwiRGVsZXRlRnVuY3Rpb25cIiwge1xuICAgICAgcnVudGltZTogbGFtYmRhLlJ1bnRpbWUuUFlUSE9OXzNfOSxcbiAgICAgIGhhbmRsZXI6ICdkZWxldGUubGFtYmRhRnVuY2lvbicsXG4gICAgICBjb2RlOiBsYW1iZGEuQ29kZS5mcm9tSW5saW5lKCdkZWYgbGFtYmRhRnVuY2lvbihldmVudCwgY29udGV4dCk6XFxuICAgIHByaW50KFwiSGVsbG8gV29ybGQgZGVsZXRlXCIpXFxuJyksXG4gICAgICBlbnZpcm9ubWVudDoge1xuICAgICAgICBUQUJMRTogaW52ZW50b3J5VGFibGUudGFibGVOYW1lLFxuICAgICAgfSxcbiAgICB9KTtcblxuICAgIC8vcGVybWlzbyBwYXJhIGxhbWJkYVxuICAgIGludmVudG9yeVRhYmxlLmdyYW50V3JpdGVEYXRhKHBvc3RGdW5jdGlvbik7XG4gICAgaW52ZW50b3J5VGFibGUuZ3JhbnQocG9zdEZ1bmN0aW9uLCBcImR5bmFtb2RiOlNjYW5cIik7XG4gICAgaW52ZW50b3J5VGFibGUuZ3JhbnRSZWFkV3JpdGVEYXRhKGNyZWF0ZUZ1bmN0aW9uKTtcbiAgICBpbnZlbnRvcnlUYWJsZS5ncmFudFJlYWRXcml0ZURhdGEoZGVsZXRlRnVuY3Rpb24pO1xuXG5cbiAgICAvL0FQSWdhdHdheVxuXG4gICAgY29uc3QgaW52ZW50b3J5QVBJID0gbmV3IGFwaWd3LlJlc3RBcGkodGhpcywgXCJJbnZlbnRvcnlBcGlcIix7XG4gICAgICBkZWZhdWx0Q29yc1ByZWZsaWdodE9wdGlvbnM6IHtcbiAgICAgICAgYWxsb3dPcmlnaW5zOiBhcGlndy5Db3JzLkFMTF9PUklHSU5TLFxuICAgICAgICBhbGxvd01ldGhvZHM6IGFwaWd3LkNvcnMuQUxMX01FVEhPRFNcbiAgICAgIH1cbiAgICAgIH0pO1xuXG4gICAgaW52ZW50b3J5QVBJLnJvb3RcbiAgICAgIC5yZXNvdXJjZUZvclBhdGgoXCJwb3N0XCIpXG4gICAgICAuYWRkTWV0aG9kKFwiUE9TVFwiLCBuZXcgYXBpZ3cuTGFtYmRhSW50ZWdyYXRpb24ocG9zdEZ1bmN0aW9uKSlcblxuICAgICAgaW52ZW50b3J5QVBJLnJvb3RcbiAgICAgIC5yZXNvdXJjZUZvclBhdGgoXCJjcmVhdGVcIilcbiAgICAgIC5hZGRNZXRob2QoXCJQT1NUXCIsIG5ldyBhcGlndy5MYW1iZGFJbnRlZ3JhdGlvbihjcmVhdGVGdW5jdGlvbikpXG5cbiAgICBpbnZlbnRvcnlBUEkucm9vdFxuICAgICAgLnJlc291cmNlRm9yUGF0aChcImRlbGV0ZVwiKVxuICAgICAgLmFkZE1ldGhvZChcIkRFTEVURVwiLCBuZXcgYXBpZ3cuTGFtYmRhSW50ZWdyYXRpb24oZGVsZXRlRnVuY3Rpb24pKVxuXG5cbiAgICAvLyBDcmVhdGVzIGEgZGlzdHJpYnV0aW9uIGZyb20gYW4gUzMgYnVja2V0LlxuXG4gICAgY29uc3QgbXlCdWNrZXQgPSBuZXcgczMuQnVja2V0KHRoaXMsICdpbnZlbnRvcnlCdWNrZXQnKTtcbiAgICBjb25zdCBidWNrZXRJbWcgPSBuZXcgczMuQnVja2V0KHRoaXMsXCJpbWdCdWNrZXRcIilcblxuICAgIG15QnVja2V0LmFkZFRvUmVzb3VyY2VQb2xpY3kobmV3IGlhbS5Qb2xpY3lTdGF0ZW1lbnQoe1xuICAgICAgZWZmZWN0OiBpYW0uRWZmZWN0LkFMTE9XLFxuICAgICAgYWN0aW9uczogWydzMzpHZXRPYmplY3QnXSxcbiAgICAgIHByaW5jaXBhbHM6IFtuZXcgaWFtLkFueVByaW5jaXBhbCgpXSxcbiAgICAgIHJlc291cmNlczogW215QnVja2V0LmFybkZvck9iamVjdHMoJyonKV0sXG4gICAgfSkpO1xuXG4gICAgYnVja2V0SW1nLmFkZFRvUmVzb3VyY2VQb2xpY3kobmV3IGlhbS5Qb2xpY3lTdGF0ZW1lbnQoe1xuICAgICAgZWZmZWN0OiBpYW0uRWZmZWN0LkFMTE9XLFxuICAgICAgYWN0aW9uczogWydzMzpHZXRPYmplY3QnLCAnczM6RGVsZXRlT2JqZWN0JywgJ3MzOlB1dE9iamVjdCcsICdzMzpQdXRPYmplY3RBY2wnXSxcbiAgICAgIHByaW5jaXBhbHM6IFtuZXcgaWFtLkFueVByaW5jaXBhbCgpXSxcbiAgICAgIHJlc291cmNlczogW2J1Y2tldEltZy5hcm5Gb3JPYmplY3RzKCcqJyldLFxuICAgIH0pKTtcbiAgICBcbiAgICBjb25zdCBvYWkgPSBuZXcgY2xvdWRmcm9udC5PcmlnaW5BY2Nlc3NJZGVudGl0eSh0aGlzLCAnbXlPQUknKTtcblxuICAgIGNvbnN0IGludmVudG9yeUZyb250ID0gbmV3IGNsb3VkZnJvbnQuQ2xvdWRGcm9udFdlYkRpc3RyaWJ1dGlvbih0aGlzLCAnaW52ZW50b3J5RnJvbnQnLCB7XG4gICAgICBvcmlnaW5Db25maWdzOiBbXG4gICAgICAgIHtcbiAgICAgICAgICBzM09yaWdpblNvdXJjZToge1xuICAgICAgICAgICAgczNCdWNrZXRTb3VyY2U6IG15QnVja2V0LFxuICAgICAgICAgICAgb3JpZ2luUGF0aDogJy9odG1sJyxcbiAgICAgICAgICAgIG9yaWdpbkFjY2Vzc0lkZW50aXR5OiBvYWlcbiAgICAgICAgICB9LFxuICAgICAgICAgIGJlaGF2aW9yczogW1xuICAgICAgICAgICAgeyBpc0RlZmF1bHRCZWhhdmlvcjogdHJ1ZSB9XG4gICAgICAgICAgXVxuICAgICAgICB9XG4gICAgICBdLFxuICAgICAgZGVmYXVsdFJvb3RPYmplY3Q6ICdpbmRleC5odG1sJ1xuICAgIH0pO1xuXG4gICAgY29uc3QgdXNlclBvb2wgPSBuZXcgY29nbml0by5Vc2VyUG9vbCh0aGlzLCAnVXNlclBvb2wnLCB7XG4gICAgICB1c2VyUG9vbE5hbWU6ICdteVVzZXJQb29sTmFtZScsXG4gICAgICBzZWxmU2lnblVwRW5hYmxlZDogZmFsc2UsIC8vIFBhcmEgZGVzaGFiaWxpdGFyIGVsIHJlZ2lzdHJvIGRlIHVzdWFyaW9zXG4gICAgICBhdXRvVmVyaWZ5OiB7IGVtYWlsOiB0cnVlIH0sIC8vIFBhcmEgdmVyaWZpY2FyIGF1dG9tw6F0aWNhbWVudGUgbGEgZGlyZWNjacOzbiBkZSBjb3JyZW8gZWxlY3Ryw7NuaWNvIGRlIGxvcyB1c3Vhcmlvc1xuICAgICAgc2lnbkluQWxpYXNlczogeyBlbWFpbDogdHJ1ZSB9LCAvLyBQYXJhIHBlcm1pdGlyIHF1ZSBsb3MgdXN1YXJpb3MgaW5pY2llbiBzZXNpw7NuIGNvbiBzdSBjb3JyZW8gZWxlY3Ryw7NuaWNvXG4gICAgICBwYXNzd29yZFBvbGljeToge1xuICAgICAgICBtaW5MZW5ndGg6IDgsXG4gICAgICAgIHJlcXVpcmVMb3dlcmNhc2U6IHRydWUsXG4gICAgICAgIHJlcXVpcmVEaWdpdHM6IHRydWUsXG4gICAgICAgIHJlcXVpcmVTeW1ib2xzOiBmYWxzZSxcbiAgICAgICAgcmVxdWlyZVVwcGVyY2FzZTogdHJ1ZVxuICAgICAgfVxuICAgIH0pO1xuICAgIFxuICAgIHVzZXJQb29sLmFkZERvbWFpbignTXlVc2VyUG9vbERvbWFpbicsIHtcbiAgICAgIGNvZ25pdG9Eb21haW46IHtcbiAgICAgICAgZG9tYWluUHJlZml4OiAnbXktYXBwLWF1dGgnXG4gICAgICB9XG4gICAgfSk7XG5cbiAgICBjb25zdCB1c2VyUG9vbENsaWVudCA9IG5ldyBjb2duaXRvLlVzZXJQb29sQ2xpZW50KHRoaXMsICdVc2VyUG9vbENsaWVudCcsIHtcbiAgICAgIHVzZXJQb29sOiB1c2VyUG9vbCxcbiAgICAgIGF1dGhGbG93czogeyBcbiAgICAgICAgdXNlclBhc3N3b3JkOiB0cnVlIFxuICAgICAgfSxcbiAgICAgIHByZXZlbnRVc2VyRXhpc3RlbmNlRXJyb3JzOiB0cnVlLFxuICAgICAgZ2VuZXJhdGVTZWNyZXQ6IGZhbHNlLFxuICAgICAgc3VwcG9ydGVkSWRlbnRpdHlQcm92aWRlcnM6IFtcbiAgICAgICAgY29nbml0by5Vc2VyUG9vbENsaWVudElkZW50aXR5UHJvdmlkZXIuQ09HTklUT1xuICAgICAgXSxcbiAgICAgIG9BdXRoOiB7XG4gICAgICAgIGZsb3dzOiB7XG4gICAgICAgICAgYXV0aG9yaXphdGlvbkNvZGVHcmFudDogdHJ1ZSxcbiAgICAgICAgICBpbXBsaWNpdENvZGVHcmFudDogdHJ1ZVxuICAgICAgICB9LFxuICAgICAgICBjYWxsYmFja1VybHM6IFtcbiAgICAgICAgICBgaHR0cHM6Ly8ke2ludmVudG9yeUZyb250LmRpc3RyaWJ1dGlvbkRvbWFpbk5hbWV9L29hdXRoMi9pZHByZXNwb25zZWBcbiAgICAgICAgXSxcbiAgICAgICAgbG9nb3V0VXJsczogW1xuICAgICAgICAgICdodHRwczovL215LWNsb3VkZnJvbnQtZGlzdHJpYnV0aW9uLmNsb3VkZnJvbnQubmV0L2xvZ291dCdcbiAgICAgICAgXVxuICAgICAgfVxuICAgIH0pO1xuXG4gIH1cbiAgXG59XG4iXX0=