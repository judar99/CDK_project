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
        const noteTable = new dynamodb.Table(this, "NoteTable", {
            partitionKey: { name: "id", type: dynamodb.AttributeType.STRING },
        });
        //Lambda Funtions 
        const postFunction = new lambda.Function(this, "PostFuntion", {
            runtime: lambda.Runtime.PYTHON_3_7,
            handler: 'index.lambdaFuncion',
            code: lambda.Code.fromInline('def lambdaFuncion(event, context):\n    print("Hello World")\n'),
            environment: {
                TABLE: noteTable.tableName,
            },
        });
        const deleteFunction = new lambda.Function(this, "DeleteFunction", {
            runtime: lambda.Runtime.PYTHON_3_9,
            handler: 'index.lambdaFuncion',
            code: lambda.Code.fromInline('def lambdaFuncion(event, context):\n    print("Hello World")\n'),
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
            .addMethod("POST", new apigw.LambdaIntegration(postFunction));
        helloAPI.root
            .resourceForPath("delete")
            .addMethod("DELETE", new apigw.LambdaIntegration(deleteFunction));
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
            defaultRootObject: 'index.html'
        });
    }
}
exports.CdkStack = CdkStack;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2RrLXN0YWNrLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiY2RrLXN0YWNrLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUFBLG1DQUFtQztBQUVuQyxpREFBaUQ7QUFDakQscURBQXFEO0FBQ3JELG9EQUFvRDtBQUNwRCx5REFBeUQ7QUFDekQsOERBQThEO0FBRTlELE1BQU0sR0FBRyxHQUFHLE9BQU8sQ0FBQyxxQkFBcUIsQ0FBQyxDQUFDO0FBQzNDLE1BQU0sSUFBSSxHQUFHLE9BQU8sQ0FBQyxNQUFNLENBQUMsQ0FBQztBQUM3Qix5Q0FBeUM7QUFFekMsTUFBYSxRQUFTLFNBQVEsR0FBRyxDQUFDLEtBQUs7SUFDckMsWUFBWSxLQUFnQixFQUFFLEVBQVUsRUFBRSxLQUFzQjtRQUM5RCxLQUFLLENBQUMsS0FBSyxFQUFFLEVBQUUsRUFBRSxLQUFLLENBQUMsQ0FBQztRQUV4QixVQUFVO1FBRVYsTUFBTSxTQUFTLEdBQUcsSUFBSSxRQUFRLENBQUMsS0FBSyxDQUFDLElBQUksRUFBRSxXQUFXLEVBQUU7WUFDdEQsWUFBWSxFQUFFLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUUsUUFBUSxDQUFDLGFBQWEsQ0FBQyxNQUFNLEVBQUU7U0FDbEUsQ0FBQyxDQUFDO1FBRUgsa0JBQWtCO1FBRWxCLE1BQU0sWUFBWSxHQUFHLElBQUksTUFBTSxDQUFDLFFBQVEsQ0FBQyxJQUFJLEVBQUUsYUFBYSxFQUFFO1lBQzVELE9BQU8sRUFBRSxNQUFNLENBQUMsT0FBTyxDQUFDLFVBQVU7WUFDbEMsT0FBTyxFQUFFLHFCQUFxQjtZQUM5QixJQUFJLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsZ0VBQWdFLENBQUM7WUFDOUYsV0FBVyxFQUFFO2dCQUNYLEtBQUssRUFBRSxTQUFTLENBQUMsU0FBUzthQUMzQjtTQUNGLENBQUMsQ0FBQztRQUlILE1BQU0sY0FBYyxHQUFHLElBQUksTUFBTSxDQUFDLFFBQVEsQ0FBQyxJQUFJLEVBQUUsZ0JBQWdCLEVBQUU7WUFDakUsT0FBTyxFQUFFLE1BQU0sQ0FBQyxPQUFPLENBQUMsVUFBVTtZQUNsQyxPQUFPLEVBQUUscUJBQXFCO1lBQzlCLElBQUksRUFBRSxNQUFNLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxnRUFBZ0UsQ0FBQztZQUM5RixXQUFXLEVBQUU7Z0JBQ1gsS0FBSyxFQUFFLFNBQVMsQ0FBQyxTQUFTO2FBQzNCO1NBQ0YsQ0FBQyxDQUFDO1FBRUgscUJBQXFCO1FBRXJCLFNBQVMsQ0FBQyxjQUFjLENBQUMsWUFBWSxDQUFDLENBQUM7UUFDdkMsU0FBUyxDQUFDLGtCQUFrQixDQUFDLGNBQWMsQ0FBQyxDQUFDO1FBRzdDLFdBQVc7UUFFWCxNQUFNLFFBQVEsR0FBRyxJQUFJLEtBQUssQ0FBQyxPQUFPLENBQUMsSUFBSSxFQUFFLFVBQVUsQ0FBQyxDQUFDO1FBRXJELFFBQVEsQ0FBQyxJQUFJO2FBQ1YsZUFBZSxDQUFDLE1BQU0sQ0FBQzthQUN2QixTQUFTLENBQUMsTUFBTSxFQUFFLElBQUksS0FBSyxDQUFDLGlCQUFpQixDQUFDLFlBQVksQ0FBQyxDQUFDLENBQUE7UUFFL0QsUUFBUSxDQUFDLElBQUk7YUFDVixlQUFlLENBQUMsUUFBUSxDQUFDO2FBQ3pCLFNBQVMsQ0FBQyxRQUFRLEVBQUUsSUFBSSxLQUFLLENBQUMsaUJBQWlCLENBQUMsY0FBYyxDQUFDLENBQUMsQ0FBQTtRQUduRSw0Q0FBNEM7UUFDNUMsTUFBTSxRQUFRLEdBQUcsSUFBSSxFQUFFLENBQUMsTUFBTSxDQUFDLElBQUksRUFBRSxVQUFVLENBQUMsQ0FBQztRQUNqRCxNQUFNLEdBQUcsR0FBRyxJQUFJLFVBQVUsQ0FBQyxvQkFBb0IsQ0FBQyxJQUFJLEVBQUUsT0FBTyxDQUFDLENBQUM7UUFFL0QsUUFBUSxDQUFDLG1CQUFtQixDQUFDLElBQUksR0FBRyxDQUFDLGVBQWUsQ0FBQztZQUNuRCxNQUFNLEVBQUUsR0FBRyxDQUFDLE1BQU0sQ0FBQyxLQUFLO1lBQ3hCLE9BQU8sRUFBRSxDQUFDLGNBQWMsQ0FBQztZQUN6QixVQUFVLEVBQUUsQ0FBQyxJQUFJLEdBQUcsQ0FBQyxZQUFZLEVBQUUsQ0FBQztZQUNwQyxTQUFTLEVBQUUsQ0FBQyxRQUFRLENBQUMsYUFBYSxDQUFDLEdBQUcsQ0FBQyxDQUFDO1NBQ3pDLENBQUMsQ0FBQyxDQUFDO1FBRUosSUFBSSxVQUFVLENBQUMsWUFBWSxDQUFDLElBQUksRUFBRSxRQUFRLEVBQUU7WUFDMUMsZUFBZSxFQUFFO2dCQUNmLE1BQU0sRUFBRSxJQUFJLE9BQU8sQ0FBQyxRQUFRLENBQUMsUUFBUSxFQUFFO29CQUNyQyxVQUFVLEVBQUUsTUFBTTtvQkFDbEIsb0JBQW9CLEVBQUUsR0FBRztpQkFDMUIsQ0FBQzthQUNIO1lBQ0QsaUJBQWlCLEVBQUMsWUFBWTtTQUMvQixDQUFDLENBQUM7SUFDTCxDQUFDO0NBRUY7QUF6RUQsNEJBeUVDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0ICogYXMgY2RrIGZyb20gJ2F3cy1jZGstbGliJztcbmltcG9ydCB7IENvbnN0cnVjdCB9IGZyb20gJ2NvbnN0cnVjdHMnO1xuaW1wb3J0ICogYXMgbGFtYmRhIGZyb20gXCJhd3MtY2RrLWxpYi9hd3MtbGFtYmRhXCI7XG5pbXBvcnQgKiBhcyBkeW5hbW9kYiBmcm9tIFwiYXdzLWNkay1saWIvYXdzLWR5bmFtb2RiXCI7XG5pbXBvcnQgKiBhcyBhcGlndyBmcm9tIFwiYXdzLWNkay1saWIvYXdzLWFwaWdhdGV3YXlcIjtcbmltcG9ydCAqIGFzIGNsb3VkZnJvbnQgZnJvbSAnYXdzLWNkay1saWIvYXdzLWNsb3VkZnJvbnQnO1xuaW1wb3J0ICogYXMgb3JpZ2lucyBmcm9tICdhd3MtY2RrLWxpYi9hd3MtY2xvdWRmcm9udC1vcmlnaW5zJztcbmltcG9ydCAqIGFzIHMzZGVwbG95IGZyb20gJ2F3cy1jZGstbGliL2F3cy1zMy1kZXBsb3ltZW50JztcbmNvbnN0IGlhbSA9IHJlcXVpcmUoJ2F3cy1jZGstbGliL2F3cy1pYW0nKTtcbmNvbnN0IHBhdGggPSByZXF1aXJlKCdwYXRoJyk7XG5pbXBvcnQgKiBhcyBzMyBmcm9tIFwiYXdzLWNkay1saWIvYXdzLXMzXCI7XG5cbmV4cG9ydCBjbGFzcyBDZGtTdGFjayBleHRlbmRzIGNkay5TdGFjayB7XG4gIGNvbnN0cnVjdG9yKHNjb3BlOiBDb25zdHJ1Y3QsIGlkOiBzdHJpbmcsIHByb3BzPzogY2RrLlN0YWNrUHJvcHMpIHtcbiAgICBzdXBlcihzY29wZSwgaWQsIHByb3BzKTtcblxuICAgIC8vRHluYW1vZGJcblxuICAgIGNvbnN0IG5vdGVUYWJsZSA9IG5ldyBkeW5hbW9kYi5UYWJsZSh0aGlzLCBcIk5vdGVUYWJsZVwiLCB7XG4gICAgICBwYXJ0aXRpb25LZXk6IHsgbmFtZTogXCJpZFwiLCB0eXBlOiBkeW5hbW9kYi5BdHRyaWJ1dGVUeXBlLlNUUklORyB9LFxuICAgIH0pO1xuXG4gICAgLy9MYW1iZGEgRnVudGlvbnMgXG5cbiAgICBjb25zdCBwb3N0RnVuY3Rpb24gPSBuZXcgbGFtYmRhLkZ1bmN0aW9uKHRoaXMsIFwiUG9zdEZ1bnRpb25cIiwge1xuICAgICAgcnVudGltZTogbGFtYmRhLlJ1bnRpbWUuUFlUSE9OXzNfNyxcbiAgICAgIGhhbmRsZXI6ICdpbmRleC5sYW1iZGFGdW5jaW9uJyxcbiAgICAgIGNvZGU6IGxhbWJkYS5Db2RlLmZyb21JbmxpbmUoJ2RlZiBsYW1iZGFGdW5jaW9uKGV2ZW50LCBjb250ZXh0KTpcXG4gICAgcHJpbnQoXCJIZWxsbyBXb3JsZFwiKVxcbicpLFxuICAgICAgZW52aXJvbm1lbnQ6IHtcbiAgICAgICAgVEFCTEU6IG5vdGVUYWJsZS50YWJsZU5hbWUsXG4gICAgICB9LFxuICAgIH0pO1xuXG4gXG4gICAgXG4gICAgY29uc3QgZGVsZXRlRnVuY3Rpb24gPSBuZXcgbGFtYmRhLkZ1bmN0aW9uKHRoaXMsIFwiRGVsZXRlRnVuY3Rpb25cIiwge1xuICAgICAgcnVudGltZTogbGFtYmRhLlJ1bnRpbWUuUFlUSE9OXzNfOSxcbiAgICAgIGhhbmRsZXI6ICdpbmRleC5sYW1iZGFGdW5jaW9uJyxcbiAgICAgIGNvZGU6IGxhbWJkYS5Db2RlLmZyb21JbmxpbmUoJ2RlZiBsYW1iZGFGdW5jaW9uKGV2ZW50LCBjb250ZXh0KTpcXG4gICAgcHJpbnQoXCJIZWxsbyBXb3JsZFwiKVxcbicpLFxuICAgICAgZW52aXJvbm1lbnQ6IHtcbiAgICAgICAgVEFCTEU6IG5vdGVUYWJsZS50YWJsZU5hbWUsXG4gICAgICB9LFxuICAgIH0pO1xuXG4gICAgLy9wZXJtaXNvIHBhcmEgbGFtYmRhXG5cbiAgICBub3RlVGFibGUuZ3JhbnRXcml0ZURhdGEocG9zdEZ1bmN0aW9uKTtcbiAgICBub3RlVGFibGUuZ3JhbnRSZWFkV3JpdGVEYXRhKGRlbGV0ZUZ1bmN0aW9uKTtcblxuXG4gICAgLy9BUElnYXR3YXlcblxuICAgIGNvbnN0IGhlbGxvQVBJID0gbmV3IGFwaWd3LlJlc3RBcGkodGhpcywgXCJoZWxsb0FwaVwiKTtcblxuICAgIGhlbGxvQVBJLnJvb3RcbiAgICAgIC5yZXNvdXJjZUZvclBhdGgoXCJwb3N0XCIpXG4gICAgICAuYWRkTWV0aG9kKFwiUE9TVFwiLCBuZXcgYXBpZ3cuTGFtYmRhSW50ZWdyYXRpb24ocG9zdEZ1bmN0aW9uKSlcblxuICAgIGhlbGxvQVBJLnJvb3RcbiAgICAgIC5yZXNvdXJjZUZvclBhdGgoXCJkZWxldGVcIilcbiAgICAgIC5hZGRNZXRob2QoXCJERUxFVEVcIiwgbmV3IGFwaWd3LkxhbWJkYUludGVncmF0aW9uKGRlbGV0ZUZ1bmN0aW9uKSlcblxuXG4gICAgLy8gQ3JlYXRlcyBhIGRpc3RyaWJ1dGlvbiBmcm9tIGFuIFMzIGJ1Y2tldC5cbiAgICBjb25zdCBteUJ1Y2tldCA9IG5ldyBzMy5CdWNrZXQodGhpcywgJ215QnVja2V0Jyk7XG4gICAgY29uc3Qgb2FpID0gbmV3IGNsb3VkZnJvbnQuT3JpZ2luQWNjZXNzSWRlbnRpdHkodGhpcywgJ215T0FJJyk7XG5cbiAgICBteUJ1Y2tldC5hZGRUb1Jlc291cmNlUG9saWN5KG5ldyBpYW0uUG9saWN5U3RhdGVtZW50KHtcbiAgICAgIGVmZmVjdDogaWFtLkVmZmVjdC5BTExPVyxcbiAgICAgIGFjdGlvbnM6IFsnczM6R2V0T2JqZWN0J10sXG4gICAgICBwcmluY2lwYWxzOiBbbmV3IGlhbS5BbnlQcmluY2lwYWwoKV0sXG4gICAgICByZXNvdXJjZXM6IFtteUJ1Y2tldC5hcm5Gb3JPYmplY3RzKCcqJyldLFxuICAgIH0pKTtcbiAgICBcbiAgICBuZXcgY2xvdWRmcm9udC5EaXN0cmlidXRpb24odGhpcywgJ215RGlzdCcsIHtcbiAgICAgIGRlZmF1bHRCZWhhdmlvcjogeyBcbiAgICAgICAgb3JpZ2luOiBuZXcgb3JpZ2lucy5TM09yaWdpbihteUJ1Y2tldCwge1xuICAgICAgICAgIG9yaWdpblBhdGg6ICcveG1sJyxcbiAgICAgICAgICBvcmlnaW5BY2Nlc3NJZGVudGl0eTogb2FpLFxuICAgICAgICB9KVxuICAgICAgfSxcbiAgICAgIGRlZmF1bHRSb290T2JqZWN0OidpbmRleC5odG1sJ1xuICAgIH0pO1xuICB9XG5cbn1cbiJdfQ==