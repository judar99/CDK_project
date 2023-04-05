"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CdkStack = void 0;
const cdk = require("aws-cdk-lib");
const lambda = require("aws-cdk-lib/aws-lambda");
const dynamodb = require("aws-cdk-lib/aws-dynamodb");
const apigw = require("aws-cdk-lib/aws-apigateway");
const cloudfront = require("aws-cdk-lib/aws-cloudfront");
const origins = require("aws-cdk-lib/aws-cloudfront-origins");
const iam = require('aws-cdk-lib/aws-iam');
const path = require('path');
const s3 = require("aws-cdk-lib/aws-s3");
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
            .addMethod("POST", new apigw.LambdaIntegration(postFunction));
        inventoryAPI.root
            .resourceForPath("create")
            .addMethod("POST", new apigw.LambdaIntegration(createFunction));
        inventoryAPI.root
            .resourceForPath("delete")
            .addMethod("POST", new apigw.LambdaIntegration(deleteFunction));
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
            defaultRootObject: 'index.html'
        });
    }
}
exports.CdkStack = CdkStack;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2RrLXN0YWNrLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiY2RrLXN0YWNrLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUFBLG1DQUFtQztBQUVuQyxpREFBaUQ7QUFDakQscURBQXFEO0FBQ3JELG9EQUFvRDtBQUNwRCx5REFBeUQ7QUFDekQsOERBQThEO0FBRTlELE1BQU0sR0FBRyxHQUFHLE9BQU8sQ0FBQyxxQkFBcUIsQ0FBQyxDQUFDO0FBQzNDLE1BQU0sSUFBSSxHQUFHLE9BQU8sQ0FBQyxNQUFNLENBQUMsQ0FBQztBQUM3Qix5Q0FBeUM7QUFFekMsTUFBYSxRQUFTLFNBQVEsR0FBRyxDQUFDLEtBQUs7SUFDckMsWUFBWSxLQUFnQixFQUFFLEVBQVUsRUFBRSxLQUFzQjtRQUM5RCxLQUFLLENBQUMsS0FBSyxFQUFFLEVBQUUsRUFBRSxLQUFLLENBQUMsQ0FBQztRQUV4QixVQUFVO1FBRVYsTUFBTSxjQUFjLEdBQUcsSUFBSSxRQUFRLENBQUMsS0FBSyxDQUFDLElBQUksRUFBRSxnQkFBZ0IsRUFBRTtZQUNoRSxZQUFZLEVBQUUsRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRSxRQUFRLENBQUMsYUFBYSxDQUFDLE1BQU0sRUFBRTtTQUNsRSxDQUFDLENBQUM7UUFFSCxrQkFBa0I7UUFFbEIsTUFBTSxZQUFZLEdBQUcsSUFBSSxNQUFNLENBQUMsUUFBUSxDQUFDLElBQUksRUFBRSxhQUFhLEVBQUU7WUFDNUQsT0FBTyxFQUFFLE1BQU0sQ0FBQyxPQUFPLENBQUMsVUFBVTtZQUNsQyxPQUFPLEVBQUUsb0JBQW9CO1lBQzdCLElBQUksRUFBRSxNQUFNLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxxRUFBcUUsQ0FBQztZQUNuRyxXQUFXLEVBQUU7Z0JBQ1gsS0FBSyxFQUFFLGNBQWMsQ0FBQyxTQUFTO2FBQ2hDO1NBQ0YsQ0FBQyxDQUFDO1FBRUgsTUFBTSxjQUFjLEdBQUcsSUFBSSxNQUFNLENBQUMsUUFBUSxDQUFD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QVUsQ0FBQyxvQkFBb0IsQ0FBQyxJQUFJLEVBQUUsT0FBTyxDQUFDLENBQUM7UUFFL0QsSUFBSSxVQUFVLENBQUMsWUFBWSxDQUFDLElBQUksRUFBRSxnQkFBZ0IsRUFBRTtZQUNsRCxlQUFlLEVBQUU7Z0JBQ2YsTUFBTSxFQUFFLElBQUksT0FBTyxDQUFDLFFBQVEsQ0FBQyxRQUFRLEVBQUU7b0JBQ3JDLFVBQVUsRUFBRSxPQUFPO29CQUNuQixvQkFBb0IsRUFBRSxHQUFHO2lCQUMxQixDQUFDO2FBQ0g7WUFDRCxpQkFBaUIsRUFBQyxZQUFZO1NBQy9CLENBQUMsQ0FBQztJQUNMLENBQUM7Q0FFRjtBQS9GRCw0QkErRkMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgKiBhcyBjZGsgZnJvbSAnYXdzLWNkay1saWInO1xuaW1wb3J0IHsgQ29uc3RydWN0IH0gZnJvbSAnY29uc3RydWN0cyc7XG5pbXBvcnQgKiBhcyBsYW1iZGEgZnJvbSBcImF3cy1jZGstbGliL2F3cy1sYW1iZGFcIjtcbmltcG9ydCAqIGFzIGR5bmFtb2RiIGZyb20gXCJhd3MtY2RrLWxpYi9hd3MtZHluYW1vZGJcIjtcbmltcG9ydCAqIGFzIGFwaWd3IGZyb20gXCJhd3MtY2RrLWxpYi9hd3MtYXBpZ2F0ZXdheVwiO1xuaW1wb3J0ICogYXMgY2xvdWRmcm9udCBmcm9tICdhd3MtY2RrLWxpYi9hd3MtY2xvdWRmcm9udCc7XG5pbXBvcnQgKiBhcyBvcmlnaW5zIGZyb20gJ2F3cy1jZGstbGliL2F3cy1jbG91ZGZyb250LW9yaWdpbnMnO1xuaW1wb3J0ICogYXMgczNkZXBsb3kgZnJvbSAnYXdzLWNkay1saWIvYXdzLXMzLWRlcGxveW1lbnQnO1xuY29uc3QgaWFtID0gcmVxdWlyZSgnYXdzLWNkay1saWIvYXdzLWlhbScpO1xuY29uc3QgcGF0aCA9IHJlcXVpcmUoJ3BhdGgnKTtcbmltcG9ydCAqIGFzIHMzIGZyb20gXCJhd3MtY2RrLWxpYi9hd3MtczNcIjtcblxuZXhwb3J0IGNsYXNzIENka1N0YWNrIGV4dGVuZHMgY2RrLlN0YWNrIHtcbiAgY29uc3RydWN0b3Ioc2NvcGU6IENvbnN0cnVjdCwgaWQ6IHN0cmluZywgcHJvcHM/OiBjZGsuU3RhY2tQcm9wcykge1xuICAgIHN1cGVyKHNjb3BlLCBpZCwgcHJvcHMpO1xuXG4gICAgLy9EeW5hbW9kYlxuXG4gICAgY29uc3QgaW52ZW50b3J5VGFibGUgPSBuZXcgZHluYW1vZGIuVGFibGUodGhpcywgXCJJbnZlbnRvcnlUYWJsZVwiLCB7XG4gICAgICBwYXJ0aXRpb25LZXk6IHsgbmFtZTogXCJpZFwiLCB0eXBlOiBkeW5hbW9kYi5BdHRyaWJ1dGVUeXBlLlNUUklORyB9LFxuICAgIH0pO1xuXG4gICAgLy9MYW1iZGEgRnVudGlvbnMgXG5cbiAgICBjb25zdCBwb3N0RnVuY3Rpb24gPSBuZXcgbGFtYmRhLkZ1bmN0aW9uKHRoaXMsIFwiUG9zdEZ1bnRpb25cIiwge1xuICAgICAgcnVudGltZTogbGFtYmRhLlJ1bnRpbWUuUFlUSE9OXzNfNyxcbiAgICAgIGhhbmRsZXI6ICdwb3N0LmxhbWJkYUZ1bmNpb24nLFxuICAgICAgY29kZTogbGFtYmRhLkNvZGUuZnJvbUlubGluZSgnZGVmIGxhbWJkYUZ1bmNpb24oZXZlbnQsIGNvbnRleHQpOlxcbiAgICBwcmludChcIkhlbGxvIFdvcmxkIHBvc3RcIilcXG4nKSxcbiAgICAgIGVudmlyb25tZW50OiB7XG4gICAgICAgIFRBQkxFOiBpbnZlbnRvcnlUYWJsZS50YWJsZU5hbWUsXG4gICAgICB9LFxuICAgIH0pO1xuXG4gICAgY29uc3QgY3JlYXRlRnVuY3Rpb24gPSBuZXcgbGFtYmRhLkZ1bmN0aW9uKHRoaXMsIFwiQ3JlYXRlRnVuY3Rpb25cIiwge1xuICAgICAgcnVudGltZTogbGFtYmRhLlJ1bnRpbWUuUFlUSE9OXzNfOSxcbiAgICAgIGhhbmRsZXI6ICdjcmVhdGUubGFtYmRhRnVuY2lvbicsXG4gICAgICBjb2RlOiBsYW1iZGEuQ29kZS5mcm9tSW5saW5lKCdkZWYgbGFtYmRhRnVuY2lvbihldmVudCwgY29udGV4dCk6XFxuICAgIHByaW50KFwiSGVsbG8gV29ybGQgZGVsZXRlXCIpXFxuJyksXG4gICAgICBlbnZpcm9ubWVudDoge1xuICAgICAgICBUQUJMRTogaW52ZW50b3J5VGFibGUudGFibGVOYW1lLFxuICAgICAgfSxcbiAgICB9KTtcblxuICAgIGNvbnN0IGRlbGV0ZUZ1bmN0aW9uID0gbmV3IGxhbWJkYS5GdW5jdGlvbih0aGlzLCBcIkRlbGV0ZUZ1bmN0aW9uXCIsIHtcbiAgICAgIHJ1bnRpbWU6IGxhbWJkYS5SdW50aW1lLlBZVEhPTl8zXzksXG4gICAgICBoYW5kbGVyOiAnaW5kZXgubGFtYmRhRnVuY2lvbicsXG4gICAgICBjb2RlOiBsYW1iZGEuQ29kZS5mcm9tSW5saW5lKCdkZWYgbGFtYmRhRnVuY2lvbihldmVudCwgY29udGV4dCk6XFxuICAgIHByaW50KFwiSGVsbG8gV29ybGQgZGVsZXRlXCIpXFxuJyksXG4gICAgICBlbnZpcm9ubWVudDoge1xuICAgICAgICBUQUJMRTogaW52ZW50b3J5VGFibGUudGFibGVOYW1lLFxuICAgICAgfSxcbiAgICB9KTtcblxuICAgIC8vcGVybWlzbyBwYXJhIGxhbWJkYVxuICAgIGludmVudG9yeVRhYmxlLmdyYW50V3JpdGVEYXRhKHBvc3RGdW5jdGlvbik7XG4gICAgaW52ZW50b3J5VGFibGUuZ3JhbnQocG9zdEZ1bmN0aW9uLCBcImR5bmFtb2RiOlNjYW5cIik7XG4gICAgaW52ZW50b3J5VGFibGUuZ3JhbnRSZWFkV3JpdGVEYXRhKGNyZWF0ZUZ1bmN0aW9uKTtcbiAgICBpbnZlbnRvcnlUYWJsZS5ncmFudFJlYWRXcml0ZURhdGEoZGVsZXRlRnVuY3Rpb24pO1xuXG5cbiAgICAvL0FQSWdhdHdheVxuXG4gICAgY29uc3QgaW52ZW50b3J5QVBJID0gbmV3IGFwaWd3LlJlc3RBcGkodGhpcywgXCJJbnZlbnRvcnlBcGlcIik7XG5cbiAgICBpbnZlbnRvcnlBUEkucm9vdFxuICAgICAgLnJlc291cmNlRm9yUGF0aChcInBvc3RcIilcbiAgICAgIC5hZGRNZXRob2QoXCJQT1NUXCIsIG5ldyBhcGlndy5MYW1iZGFJbnRlZ3JhdGlvbihwb3N0RnVuY3Rpb24pKVxuXG4gICAgICBpbnZlbnRvcnlBUEkucm9vdFxuICAgICAgLnJlc291cmNlRm9yUGF0aChcImNyZWF0ZVwiKVxuICAgICAgLmFkZE1ldGhvZChcIlBPU1RcIiwgbmV3IGFwaWd3LkxhbWJkYUludGVncmF0aW9uKGNyZWF0ZUZ1bmN0aW9uKSlcblxuICAgIGludmVudG9yeUFQSS5yb290XG4gICAgICAucmVzb3VyY2VGb3JQYXRoKFwiZGVsZXRlXCIpXG4gICAgICAuYWRkTWV0aG9kKFwiUE9TVFwiLCBuZXcgYXBpZ3cuTGFtYmRhSW50ZWdyYXRpb24oZGVsZXRlRnVuY3Rpb24pKVxuXG5cbiAgICAvLyBDcmVhdGVzIGEgZGlzdHJpYnV0aW9uIGZyb20gYW4gUzMgYnVja2V0LlxuXG4gICAgY29uc3QgbXlCdWNrZXQgPSBuZXcgczMuQnVja2V0KHRoaXMsICdpbnZlbnRvcnlCdWNrZXQnKTtcbiAgICBjb25zdCBidWNrZXRJbWcgPSBuZXcgczMuQnVja2V0KHRoaXMsXCJpbWdCdWNrZXRcIilcblxuICAgIG15QnVja2V0LmFkZFRvUmVzb3VyY2VQb2xpY3kobmV3IGlhbS5Qb2xpY3lTdGF0ZW1lbnQoe1xuICAgICAgZWZmZWN0OiBpYW0uRWZmZWN0LkFMTE9XLFxuICAgICAgYWN0aW9uczogWydzMzpHZXRPYmplY3QnXSxcbiAgICAgIHByaW5jaXBhbHM6IFtuZXcgaWFtLkFueVByaW5jaXBhbCgpXSxcbiAgICAgIHJlc291cmNlczogW215QnVja2V0LmFybkZvck9iamVjdHMoJyonKV0sXG4gICAgfSkpO1xuICAgXG4gICAgYnVja2V0SW1nLmFkZFRvUmVzb3VyY2VQb2xpY3kobmV3IGlhbS5Qb2xpY3lTdGF0ZW1lbnQoe1xuICAgICAgZWZmZWN0OiBpYW0uRWZmZWN0LkFMTE9XLFxuICAgICAgYWN0aW9uczogWydzMzpHZXRPYmplY3QnLCAnczM6RGVsZXRlT2JqZWN0J10sXG4gICAgICBwcmluY2lwYWxzOiBbbmV3IGlhbS5BbnlQcmluY2lwYWwoKV0sXG4gICAgICByZXNvdXJjZXM6IFtidWNrZXRJbWcuYXJuRm9yT2JqZWN0cygnKicpXSxcbiAgICB9KSk7XG5cbiAgICBjb25zdCBvYWkgPSBuZXcgY2xvdWRmcm9udC5PcmlnaW5BY2Nlc3NJZGVudGl0eSh0aGlzLCAnbXlPQUknKTtcblxuICAgIG5ldyBjbG91ZGZyb250LkRpc3RyaWJ1dGlvbih0aGlzLCAnaW52ZW50b3J5RnJvbnQnLCB7XG4gICAgICBkZWZhdWx0QmVoYXZpb3I6IHsgXG4gICAgICAgIG9yaWdpbjogbmV3IG9yaWdpbnMuUzNPcmlnaW4obXlCdWNrZXQsIHtcbiAgICAgICAgICBvcmlnaW5QYXRoOiAnL2h0bWwnLFxuICAgICAgICAgIG9yaWdpbkFjY2Vzc0lkZW50aXR5OiBvYWksXG4gICAgICAgIH0pXG4gICAgICB9LFxuICAgICAgZGVmYXVsdFJvb3RPYmplY3Q6J2luZGV4Lmh0bWwnXG4gICAgfSk7XG4gIH1cbiAgXG59XG4iXX0=