"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CdkStack = void 0;
const cdk = require("aws-cdk-lib");
const lambda = require("aws-cdk-lib/aws-lambda");
const dynamodb = require("aws-cdk-lib/aws-dynamodb");
const apigw = require("aws-cdk-lib/aws-apigateway");
const cloudfront = require("aws-cdk-lib/aws-cloudfront");
const origins = require("aws-cdk-lib/aws-cloudfront-origins");
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
        new cloudfront.Distribution(this, 'inventoryFront', {
            defaultBehavior: {
                origin: new origins.S3Origin(myBucket, {
                    originPath: '/html',
                    originAccessIdentity: oai,
                })
            },
            defaultRootObject: 'index.html'
        });
        const userPool = new cognito.UserPool(this, 'UserPool', {
            userPoolName: 'UserPoolInvetory',
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
                domainPrefix: 'inventory-auth'
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
                    'https://d14vf7jze9u0j0.cloudfront.net/?code=b5ad2157-de34-46e6-8597-2a133f523f31'
                ],
                logoutUrls: [
                    'https://my-cloudfront-distribution.cloudfront.net/logout'
                ]
            }
        });
    }
}
exports.CdkStack = CdkStack;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2RrLXN0YWNrLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiY2RrLXN0YWNrLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUFBLG1DQUFtQztBQUVuQyxpREFBaUQ7QUFDakQscURBQXFEO0FBQ3JELG9EQUFvRDtBQUNwRCx5REFBeUQ7QUFDekQsOERBQThEO0FBRzlELHlDQUF5QztBQUN6QyxtREFBbUQ7QUFDbkQsTUFBTSxHQUFHLEdBQUcsT0FBTyxDQUFDLHFCQUFxQixDQUFDLENBQUM7QUFDM0MsTUFBTSxJQUFJLEdBQUcsT0FBTyxDQUFDLE1BQU0sQ0FBQyxDQUFDO0FBRzdCLE1BQWEsUUFBUyxTQUFRLEdBQUcsQ0FBQyxLQUFLO0lBQ3JDLFlBQVksS0FBZ0IsRUFBRSxFQUFVLEVBQUUsS0FBc0I7UUFDOUQsS0FBSyxDQUFDLEtBQUssRUFBRSxFQUFFLEVBQUUsS0FBSyxDQUFDLENBQUM7UUFFeEIsVUFBVTtRQUVWLE1BQU0sY0FBYyxHQUFHLElBQUksUUFBUSxDQUFDLEtBQUssQ0FBQyxJQUFJLEVBQUUsZ0JBQWdCLEVBQUU7WUFDaEUsWUFBWSxFQUFFLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUUsUUFBUSxDQUFDLGFBQWEsQ0FBQyxNQUFNLEVBQUU7U0FDbEUsQ0FBQyxDQUFDO1FBRUgsa0JBQWtCO1FBRWxCLE1BQU0sWUFBWSxHQUFHLElBQUksTUFBTSxDQUFDLFFBQVEsQ0FBQyxJQUFJLEVBQUUsYUFBYSxFQUFFO1lBQzVELE9BQU8sRUFBRSxNQUFNLENBQUMsT0FBTyxDQUFDLFVBQVU7WUFDbEMsT0FBTyxFQUFFLG9CQUFvQjtZQUM3QixJQUFJLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMscUVBQXFFLENBQUM7WUFDbkcsV0FBVyxFQUFFO2dCQUNYLEtBQUssRUFBRSxjQUFjLENBQUMsU0FBUzthQUNoQztTQUNGLENBQUMsQ0FBQztRQUVILE1BQU0sY0FBYyxHQUFHLElBQUksTUFBTSxDQUFDLFFBQVEsQ0FBQyxJQUFJLEVBQUUsZ0JBQWdCLEVBQUU7WUFDakUsT0FBTyxFQUFFLE1BQU0sQ0FBQyxPQUFPLENBQUMsVUFBVTtZQUNsQyxPQUFPLEVBQUUsc0JBQXNCO1lBQy9CLElBQUksRUFBRSxNQUFNLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyx1RUFBdUUsQ0FBQztZQUNyRyxXQUFXLEVBQUU7Z0JBQ1gsS0FBSyxFQUFFLGNBQWMsQ0FBQyxTQUFTO2FBQ2hDO1NBQ0YsQ0FBQyxDQUFDO1FBRUgsTUFBTSxjQUFjLEdBQUcsSUFBSSxNQUFNLENBQUMsUUFBUSxDQUFDLElBQUksRUFBRSxnQkFBZ0IsRUFBRTtZQUNqRSxPQUFPLEVBQUUsTUFBTSxDQUFDLE9BQU8sQ0FBQyxVQUFVO1lBQ2xDLE9BQU8sRUFBRSxzQkFBc0I7WUFDL0IsSUFBSSxFQUFFLE1BQU0sQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLHVFQUF1RSxDQUFDO1lBQ3JHLFdBQVcsRUFBRTtnQkFDWCxLQUFLLEVBQUUsY0FBYyxDQUFDLFNBQVM7YUFDaEM7U0FDRixDQUFDLENBQUM7UUFFSCxxQkFBcUI7UUFDckIsY0FBYyxDQUFDLGNBQWMsQ0FBQyxZQUFZLENBQUMsQ0FBQztRQUM1QyxjQUFjLENBQUMsS0FBSyxDQUFDLFlBQVksRUFBRSxlQUFlLENBQUMsQ0FBQztRQUNwRCxjQUFjLENBQUMsa0JBQWtCLENBQUMsY0FBYyxDQUFDLENBQUM7UUFDbEQsY0FBYyxDQUFDLGtCQUFrQixDQUFDLGNBQWMsQ0FBQyxDQUFDO1FBR2xELFdBQVc7UUFFWCxNQUFNLFlBQVksR0FBRyxJQUFJLEtBQUssQ0FBQyxPQUFPLENBQUMsSUFBSSxFQUFFLGNBQWMsRUFBQztZQUMxRCwyQkFBMkIsRUFBRTtnQkFDM0IsWUFBWSxFQUFFLEtBQUssQ0FBQyxJQUFJLENBQUMsV0FBVztnQkFDcEMsWUFBWSxFQUFFLEtBQUssQ0FBQyxJQUFJLENBQUMsV0FBVzthQUNyQztTQUNBLENBQUMsQ0FBQztRQUVMLFlBQVksQ0FBQyxJQUFJO2FBQ2QsZUFBZSxDQUFDLE1BQU0sQ0FBQzthQUN2QixTQUFTLENBQUMsTUFBTSxFQUFFLElBQUksS0FBSyxDQUFDLGlCQUFpQixDQUFDLFlBQVksQ0FBQyxDQUFDLENBQUE7UUFFN0QsWUFBWSxDQUFDLElBQUk7YUFDaEIsZUFBZSxDQUFDLFFBQVEsQ0FBQzthQUN6QixTQUFTLENBQUMsTUFBTSxFQUFFLElBQUksS0FBSyxDQUFDLGlCQUFpQixDQUFDLGNBQWMsQ0FBQyxDQUFDLENBQUE7UUFFakUsWUFBWSxDQUFDLElBQUk7YUFDZCxlQUFlLENBQUMsUUFBUSxDQUFDO2FBQ3pCLFNBQVMsQ0FBQyxRQUFRLEVBQUUsSUFBSSxLQUFLLENBQUMsaUJBQWlCLENBQUMsY0FBYyxDQUFDLENBQUMsQ0FBQTtRQUduRSw0Q0FBNEM7UUFFNUMsTUFBTSxRQUFRLEdBQUcsSUFBSSxFQUFFLENBQUMsTUFBTSxDQUFDLElBQUksRUFBRSxpQkFBaUIsQ0FBQyxDQUFDO1FBQ3hELE1BQU0sU0FBUyxHQUFHLElBQUksRUFBRSxDQUFDLE1BQU0sQ0FBQyxJQUFJLEVBQUMsV0FBVyxDQUFDLENBQUE7UUFFakQsUUFBUSxDQUFDLG1CQUFtQixDQUFDLElBQUksR0FBRyxDQUFDLGVBQWUsQ0FBQztZQUNuRCxNQUFNLEVBQUUsR0FBRyxDQUFDLE1BQU0sQ0FBQyxLQUFLO1lBQ3hCLE9BQU8sRUFBRSxDQUFDLGNBQWMsQ0FBQztZQUN6QixVQUFVLEVBQUUsQ0FBQyxJQUFJLEdBQUcsQ0FBQyxZQUFZLEVBQUUsQ0FBQztZQUNwQyxTQUFTLEVBQUUsQ0FBQyxRQUFRLENBQUMsYUFBYSxDQUFDLEdBQUcsQ0FBQyxDQUFDO1NBQ3pDLENBQUMsQ0FBQyxDQUFDO1FBRUosU0FBUyxDQUFDLG1CQUFtQixDQUFDLElBQUksR0FBRyxDQUFDLGVBQWUsQ0FBQztZQUNwRCxNQUFNLEVBQUUsR0FBRyxDQUFDLE1BQU0sQ0FBQyxLQUFLO1lBQ3hCLE9BQU8sRUFBRSxDQUFDLGNBQWMsRUFBRSxpQkFBaUIsRUFBRSxjQUFjLEVBQUUsaUJBQWlCLENBQUM7WUFDL0UsVUFBVSxFQUFFLENBQUMsSUFBSSxHQUFHLENBQUMsWUFBWSxFQUFFLENBQUM7WUFDcEMsU0FBUyxFQUFFLENBQUMsU0FBUyxDQUFDLGFBQWEsQ0FBQyxHQUFHLENBQUMsQ0FBQztTQUMxQyxDQUFDLENBQUMsQ0FBQztRQUVKLE1BQU0sR0FBRyxHQUFHLElBQUksVUFBVSxDQUFDLG9CQUFvQixDQUFDLElBQUksRUFBRSxPQUFPLENBQUMsQ0FBQztRQUUvRCxJQUFJLFVBQVUsQ0FBQyxZQUFZLENBQUMsSUFBSSxFQUFFLGdCQUFnQixFQUFFO1lBQ2xELGVBQWUsRUFBRTtnQkFDZixNQUFNLEVBQUUsSUFBSSxPQUFPLENBQUMsUUFBUSxDQUFDLFFBQVEsRUFBRTtvQkFDckMsVUFBVSxFQUFFLE9BQU87b0JBQ25CLG9CQUFvQixFQUFFLEdBQUc7aUJBQzFCLENBQUM7YUFDSDtZQUNELGlCQUFpQixFQUFDLFlBQVk7U0FDL0IsQ0FBQyxDQUFDO1FBRUgsTUFBTSxRQUFRLEdBQUcsSUFBSSxPQUFPLENBQUMsUUFBUSxDQUFDLElBQUksRUFBRSxVQUFVLEVBQUU7WUFDdEQsWUFBWSxFQUFFLGtCQUFrQjtZQUNoQyxpQkFBaUIsRUFBRSxLQUFLO1lBQ3hCLFVBQVUsRUFBRSxFQUFFLEtBQUssRUFBRSxJQUFJLEVBQUU7WUFDM0IsYUFBYSxFQUFFLEVBQUUsS0FBSyxFQUFFLElBQUksRUFBRTtZQUM5QixjQUFjLEVBQUU7Z0JBQ2QsU0FBUyxFQUFFLENBQUM7Z0JBQ1osZ0JBQWdCLEVBQUUsSUFBSTtnQkFDdEIsYUFBYSxFQUFFLElBQUk7Z0JBQ25CLGNBQWMsRUFBRSxLQUFLO2dCQUNyQixnQkFBZ0IsRUFBRSxJQUFJO2FBQ3ZCO1NBQ0YsQ0FBQyxDQUFDO1FBRUgsUUFBUSxDQUFDLFNBQVMsQ0FBQyxrQkFBa0IsRUFBRTtZQUNyQyxhQUFhLEVBQUU7Z0JBQ2IsWUFBWSxFQUFFLGdCQUFnQjthQUMvQjtTQUNGLENBQUMsQ0FBQztRQUVILE1BQU0sY0FBYyxHQUFHLElBQUksT0FBTyxDQUFDLGNBQWMsQ0FBQyxJQUFJLEVBQUUsZ0JBQWdCLEVBQUU7WUFDeEUsUUFBUSxFQUFFLFFBQVE7WUFDbEIsU0FBUyxFQUFFO2dCQUNULFlBQVksRUFBRSxJQUFJO2FBQ25CO1lBQ0QsMEJBQTBCLEVBQUUsSUFBSTtZQUNoQyxjQUFjLEVBQUUsS0FBSztZQUNyQiwwQkFBMEIsRUFBRTtnQkFDMUIsT0FBTyxDQUFDLDhCQUE4QixDQUFDLE9BQU87YUFDL0M7WUFDRCxLQUFLLEVBQUU7Z0JBQ0wsS0FBSyxFQUFFO29CQUNMLHNCQUFzQixFQUFFLElBQUk7b0JBQzVCLGlCQUFpQixFQUFFLElBQUk7aUJBQ3hCO2dCQUNELFlBQVksRUFBRTtvQkFDWixrRkFBa0Y7aUJBQ25GO2dCQUNELFVBQVUsRUFBRTtvQkFDViwwREFBMEQ7aUJBQzNEO2FBQ0Y7U0FDRixDQUFDLENBQUM7SUFFTCxDQUFDO0NBRUY7QUFqSkQsNEJBaUpDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0ICogYXMgY2RrIGZyb20gJ2F3cy1jZGstbGliJztcbmltcG9ydCB7IENvbnN0cnVjdCB9IGZyb20gJ2NvbnN0cnVjdHMnO1xuaW1wb3J0ICogYXMgbGFtYmRhIGZyb20gXCJhd3MtY2RrLWxpYi9hd3MtbGFtYmRhXCI7XG5pbXBvcnQgKiBhcyBkeW5hbW9kYiBmcm9tIFwiYXdzLWNkay1saWIvYXdzLWR5bmFtb2RiXCI7XG5pbXBvcnQgKiBhcyBhcGlndyBmcm9tIFwiYXdzLWNkay1saWIvYXdzLWFwaWdhdGV3YXlcIjtcbmltcG9ydCAqIGFzIGNsb3VkZnJvbnQgZnJvbSAnYXdzLWNkay1saWIvYXdzLWNsb3VkZnJvbnQnO1xuaW1wb3J0ICogYXMgb3JpZ2lucyBmcm9tICdhd3MtY2RrLWxpYi9hd3MtY2xvdWRmcm9udC1vcmlnaW5zJztcbmltcG9ydCAqIGFzIHMzZGVwbG95IGZyb20gJ2F3cy1jZGstbGliL2F3cy1zMy1kZXBsb3ltZW50JztcbmltcG9ydCAqIGFzIGFwaWd3djIgZnJvbSBcImF3cy1jZGstbGliL2F3cy1hcGlnYXRld2F5djJcIjtcbmltcG9ydCAqIGFzIHMzIGZyb20gXCJhd3MtY2RrLWxpYi9hd3MtczNcIjtcbmltcG9ydCAqIGFzIGNvZ25pdG8gZnJvbSBcImF3cy1jZGstbGliL2F3cy1jb2duaXRvXCI7XG5jb25zdCBpYW0gPSByZXF1aXJlKCdhd3MtY2RrLWxpYi9hd3MtaWFtJyk7XG5jb25zdCBwYXRoID0gcmVxdWlyZSgncGF0aCcpO1xuXG5cbmV4cG9ydCBjbGFzcyBDZGtTdGFjayBleHRlbmRzIGNkay5TdGFjayB7XG4gIGNvbnN0cnVjdG9yKHNjb3BlOiBDb25zdHJ1Y3QsIGlkOiBzdHJpbmcsIHByb3BzPzogY2RrLlN0YWNrUHJvcHMpIHtcbiAgICBzdXBlcihzY29wZSwgaWQsIHByb3BzKTtcblxuICAgIC8vRHluYW1vZGJcblxuICAgIGNvbnN0IGludmVudG9yeVRhYmxlID0gbmV3IGR5bmFtb2RiLlRhYmxlKHRoaXMsIFwiSW52ZW50b3J5VGFibGVcIiwge1xuICAgICAgcGFydGl0aW9uS2V5OiB7IG5hbWU6IFwiaWRcIiwgdHlwZTogZHluYW1vZGIuQXR0cmlidXRlVHlwZS5TVFJJTkcgfSxcbiAgICB9KTtcblxuICAgIC8vTGFtYmRhIEZ1bnRpb25zIFxuXG4gICAgY29uc3QgcG9zdEZ1bmN0aW9uID0gbmV3IGxhbWJkYS5GdW5jdGlvbih0aGlzLCBcIlBvc3RGdW50aW9uXCIsIHtcbiAgICAgIHJ1bnRpbWU6IGxhbWJkYS5SdW50aW1lLlBZVEhPTl8zXzcsXG4gICAgICBoYW5kbGVyOiAncG9zdC5sYW1iZGFGdW5jaW9uJyxcbiAgICAgIGNvZGU6IGxhbWJkYS5Db2RlLmZyb21JbmxpbmUoJ2RlZiBsYW1iZGFGdW5jaW9uKGV2ZW50LCBjb250ZXh0KTpcXG4gICAgcHJpbnQoXCJIZWxsbyBXb3JsZCBwb3N0XCIpXFxuJyksXG4gICAgICBlbnZpcm9ubWVudDoge1xuICAgICAgICBUQUJMRTogaW52ZW50b3J5VGFibGUudGFibGVOYW1lLFxuICAgICAgfSxcbiAgICB9KTtcblxuICAgIGNvbnN0IGNyZWF0ZUZ1bmN0aW9uID0gbmV3IGxhbWJkYS5GdW5jdGlvbih0aGlzLCBcIkNyZWF0ZUZ1bmN0aW9uXCIsIHtcbiAgICAgIHJ1bnRpbWU6IGxhbWJkYS5SdW50aW1lLlBZVEhPTl8zXzksXG4gICAgICBoYW5kbGVyOiAnY3JlYXRlLmxhbWJkYUZ1bmNpb24nLFxuICAgICAgY29kZTogbGFtYmRhLkNvZGUuZnJvbUlubGluZSgnZGVmIGxhbWJkYUZ1bmNpb24oZXZlbnQsIGNvbnRleHQpOlxcbiAgICBwcmludChcIkhlbGxvIFdvcmxkIGNyZWF0ZVwiKVxcbicpLFxuICAgICAgZW52aXJvbm1lbnQ6IHtcbiAgICAgICAgVEFCTEU6IGludmVudG9yeVRhYmxlLnRhYmxlTmFtZSxcbiAgICAgIH0sXG4gICAgfSk7XG5cbiAgICBjb25zdCBkZWxldGVGdW5jdGlvbiA9IG5ldyBsYW1iZGEuRnVuY3Rpb24odGhpcywgXCJEZWxldGVGdW5jdGlvblwiLCB7XG4gICAgICBydW50aW1lOiBsYW1iZGEuUnVudGltZS5QWVRIT05fM185LFxuICAgICAgaGFuZGxlcjogJ2RlbGV0ZS5sYW1iZGFGdW5jaW9uJyxcbiAgICAgIGNvZGU6IGxhbWJkYS5Db2RlLmZyb21JbmxpbmUoJ2RlZiBsYW1iZGFGdW5jaW9uKGV2ZW50LCBjb250ZXh0KTpcXG4gICAgcHJpbnQoXCJIZWxsbyBXb3JsZCBkZWxldGVcIilcXG4nKSxcbiAgICAgIGVudmlyb25tZW50OiB7XG4gICAgICAgIFRBQkxFOiBpbnZlbnRvcnlUYWJsZS50YWJsZU5hbWUsXG4gICAgICB9LFxuICAgIH0pO1xuXG4gICAgLy9wZXJtaXNvIHBhcmEgbGFtYmRhXG4gICAgaW52ZW50b3J5VGFibGUuZ3JhbnRXcml0ZURhdGEocG9zdEZ1bmN0aW9uKTtcbiAgICBpbnZlbnRvcnlUYWJsZS5ncmFudChwb3N0RnVuY3Rpb24sIFwiZHluYW1vZGI6U2NhblwiKTtcbiAgICBpbnZlbnRvcnlUYWJsZS5ncmFudFJlYWRXcml0ZURhdGEoY3JlYXRlRnVuY3Rpb24pO1xuICAgIGludmVudG9yeVRhYmxlLmdyYW50UmVhZFdyaXRlRGF0YShkZWxldGVGdW5jdGlvbik7XG5cblxuICAgIC8vQVBJZ2F0d2F5XG5cbiAgICBjb25zdCBpbnZlbnRvcnlBUEkgPSBuZXcgYXBpZ3cuUmVzdEFwaSh0aGlzLCBcIkludmVudG9yeUFwaVwiLHtcbiAgICAgIGRlZmF1bHRDb3JzUHJlZmxpZ2h0T3B0aW9uczoge1xuICAgICAgICBhbGxvd09yaWdpbnM6IGFwaWd3LkNvcnMuQUxMX09SSUdJTlMsXG4gICAgICAgIGFsbG93TWV0aG9kczogYXBpZ3cuQ29ycy5BTExfTUVUSE9EU1xuICAgICAgfVxuICAgICAgfSk7XG5cbiAgICBpbnZlbnRvcnlBUEkucm9vdFxuICAgICAgLnJlc291cmNlRm9yUGF0aChcInBvc3RcIilcbiAgICAgIC5hZGRNZXRob2QoXCJQT1NUXCIsIG5ldyBhcGlndy5MYW1iZGFJbnRlZ3JhdGlvbihwb3N0RnVuY3Rpb24pKVxuXG4gICAgICBpbnZlbnRvcnlBUEkucm9vdFxuICAgICAgLnJlc291cmNlRm9yUGF0aChcImNyZWF0ZVwiKVxuICAgICAgLmFkZE1ldGhvZChcIlBPU1RcIiwgbmV3IGFwaWd3LkxhbWJkYUludGVncmF0aW9uKGNyZWF0ZUZ1bmN0aW9uKSlcblxuICAgIGludmVudG9yeUFQSS5yb290XG4gICAgICAucmVzb3VyY2VGb3JQYXRoKFwiZGVsZXRlXCIpXG4gICAgICAuYWRkTWV0aG9kKFwiREVMRVRFXCIsIG5ldyBhcGlndy5MYW1iZGFJbnRlZ3JhdGlvbihkZWxldGVGdW5jdGlvbikpXG5cblxuICAgIC8vIENyZWF0ZXMgYSBkaXN0cmlidXRpb24gZnJvbSBhbiBTMyBidWNrZXQuXG5cbiAgICBjb25zdCBteUJ1Y2tldCA9IG5ldyBzMy5CdWNrZXQodGhpcywgJ2ludmVudG9yeUJ1Y2tldCcpO1xuICAgIGNvbnN0IGJ1Y2tldEltZyA9IG5ldyBzMy5CdWNrZXQodGhpcyxcImltZ0J1Y2tldFwiKVxuXG4gICAgbXlCdWNrZXQuYWRkVG9SZXNvdXJjZVBvbGljeShuZXcgaWFtLlBvbGljeVN0YXRlbWVudCh7XG4gICAgICBlZmZlY3Q6IGlhbS5FZmZlY3QuQUxMT1csXG4gICAgICBhY3Rpb25zOiBbJ3MzOkdldE9iamVjdCddLFxuICAgICAgcHJpbmNpcGFsczogW25ldyBpYW0uQW55UHJpbmNpcGFsKCldLFxuICAgICAgcmVzb3VyY2VzOiBbbXlCdWNrZXQuYXJuRm9yT2JqZWN0cygnKicpXSxcbiAgICB9KSk7XG5cbiAgICBidWNrZXRJbWcuYWRkVG9SZXNvdXJjZVBvbGljeShuZXcgaWFtLlBvbGljeVN0YXRlbWVudCh7XG4gICAgICBlZmZlY3Q6IGlhbS5FZmZlY3QuQUxMT1csXG4gICAgICBhY3Rpb25zOiBbJ3MzOkdldE9iamVjdCcsICdzMzpEZWxldGVPYmplY3QnLCAnczM6UHV0T2JqZWN0JywgJ3MzOlB1dE9iamVjdEFjbCddLFxuICAgICAgcHJpbmNpcGFsczogW25ldyBpYW0uQW55UHJpbmNpcGFsKCldLFxuICAgICAgcmVzb3VyY2VzOiBbYnVja2V0SW1nLmFybkZvck9iamVjdHMoJyonKV0sXG4gICAgfSkpO1xuICAgIFxuICAgIGNvbnN0IG9haSA9IG5ldyBjbG91ZGZyb250Lk9yaWdpbkFjY2Vzc0lkZW50aXR5KHRoaXMsICdteU9BSScpO1xuXG4gICAgbmV3IGNsb3VkZnJvbnQuRGlzdHJpYnV0aW9uKHRoaXMsICdpbnZlbnRvcnlGcm9udCcsIHtcbiAgICAgIGRlZmF1bHRCZWhhdmlvcjogeyBcbiAgICAgICAgb3JpZ2luOiBuZXcgb3JpZ2lucy5TM09yaWdpbihteUJ1Y2tldCwge1xuICAgICAgICAgIG9yaWdpblBhdGg6ICcvaHRtbCcsXG4gICAgICAgICAgb3JpZ2luQWNjZXNzSWRlbnRpdHk6IG9haSxcbiAgICAgICAgfSlcbiAgICAgIH0sXG4gICAgICBkZWZhdWx0Um9vdE9iamVjdDonaW5kZXguaHRtbCdcbiAgICB9KTtcblxuICAgIGNvbnN0IHVzZXJQb29sID0gbmV3IGNvZ25pdG8uVXNlclBvb2wodGhpcywgJ1VzZXJQb29sJywge1xuICAgICAgdXNlclBvb2xOYW1lOiAnVXNlclBvb2xJbnZldG9yeScsXG4gICAgICBzZWxmU2lnblVwRW5hYmxlZDogZmFsc2UsIC8vIFBhcmEgZGVzaGFiaWxpdGFyIGVsIHJlZ2lzdHJvIGRlIHVzdWFyaW9zXG4gICAgICBhdXRvVmVyaWZ5OiB7IGVtYWlsOiB0cnVlIH0sIC8vIFBhcmEgdmVyaWZpY2FyIGF1dG9tw6F0aWNhbWVudGUgbGEgZGlyZWNjacOzbiBkZSBjb3JyZW8gZWxlY3Ryw7NuaWNvIGRlIGxvcyB1c3Vhcmlvc1xuICAgICAgc2lnbkluQWxpYXNlczogeyBlbWFpbDogdHJ1ZSB9LCAvLyBQYXJhIHBlcm1pdGlyIHF1ZSBsb3MgdXN1YXJpb3MgaW5pY2llbiBzZXNpw7NuIGNvbiBzdSBjb3JyZW8gZWxlY3Ryw7NuaWNvXG4gICAgICBwYXNzd29yZFBvbGljeToge1xuICAgICAgICBtaW5MZW5ndGg6IDgsXG4gICAgICAgIHJlcXVpcmVMb3dlcmNhc2U6IHRydWUsXG4gICAgICAgIHJlcXVpcmVEaWdpdHM6IHRydWUsXG4gICAgICAgIHJlcXVpcmVTeW1ib2xzOiBmYWxzZSxcbiAgICAgICAgcmVxdWlyZVVwcGVyY2FzZTogdHJ1ZVxuICAgICAgfVxuICAgIH0pO1xuICAgIFxuICAgIHVzZXJQb29sLmFkZERvbWFpbignTXlVc2VyUG9vbERvbWFpbicsIHtcbiAgICAgIGNvZ25pdG9Eb21haW46IHtcbiAgICAgICAgZG9tYWluUHJlZml4OiAnaW52ZW50b3J5LWF1dGgnXG4gICAgICB9XG4gICAgfSk7XG5cbiAgICBjb25zdCB1c2VyUG9vbENsaWVudCA9IG5ldyBjb2duaXRvLlVzZXJQb29sQ2xpZW50KHRoaXMsICdVc2VyUG9vbENsaWVudCcsIHtcbiAgICAgIHVzZXJQb29sOiB1c2VyUG9vbCxcbiAgICAgIGF1dGhGbG93czogeyBcbiAgICAgICAgdXNlclBhc3N3b3JkOiB0cnVlIFxuICAgICAgfSxcbiAgICAgIHByZXZlbnRVc2VyRXhpc3RlbmNlRXJyb3JzOiB0cnVlLFxuICAgICAgZ2VuZXJhdGVTZWNyZXQ6IGZhbHNlLFxuICAgICAgc3VwcG9ydGVkSWRlbnRpdHlQcm92aWRlcnM6IFtcbiAgICAgICAgY29nbml0by5Vc2VyUG9vbENsaWVudElkZW50aXR5UHJvdmlkZXIuQ09HTklUT1xuICAgICAgXSxcbiAgICAgIG9BdXRoOiB7XG4gICAgICAgIGZsb3dzOiB7XG4gICAgICAgICAgYXV0aG9yaXphdGlvbkNvZGVHcmFudDogdHJ1ZSxcbiAgICAgICAgICBpbXBsaWNpdENvZGVHcmFudDogdHJ1ZVxuICAgICAgICB9LFxuICAgICAgICBjYWxsYmFja1VybHM6IFtcbiAgICAgICAgICAnaHR0cHM6Ly9kMTR2ZjdqemU5dTBqMC5jbG91ZGZyb250Lm5ldC8/Y29kZT1iNWFkMjE1Ny1kZTM0LTQ2ZTYtODU5Ny0yYTEzM2Y1MjNmMzEnXG4gICAgICAgIF0sXG4gICAgICAgIGxvZ291dFVybHM6IFtcbiAgICAgICAgICAnaHR0cHM6Ly9teS1jbG91ZGZyb250LWRpc3RyaWJ1dGlvbi5jbG91ZGZyb250Lm5ldC9sb2dvdXQnXG4gICAgICAgIF1cbiAgICAgIH1cbiAgICB9KTtcblxuICB9XG4gIFxufVxuIl19