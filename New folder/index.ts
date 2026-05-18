import * as AWS from 'aws-sdk'
import { Client } from '@opensearch-project/opensearch';
import { AwsSigv4Signer } from '@opensearch-project/opensearch/aws';

export const handler = async function (event: any, context: any) {
  console.log('Received event:', JSON.stringify(event, null, 2));

  const osDomain = process.env.OPENSEARCH_URL;
  const client = new Client({
    ...AwsSigv4Signer({
      region: process.env.AWS_REGION || 'us-east-1',
      service: 'aoss',
      getCredentials: () => {
        return new Promise((resolve, reject) => {
          AWS.config.getCredentials((err, credentials) => {
            if (err) {
              reject(err);
            } else {
              resolve(credentials!);
            }
          });
        })
      }
      ,
    }),
    node: `https://${osDomain}`, // OpenSearch domain URL
  });

  for (const record of event.Records) {
    console.log(record.eventID);
    console.log(record.eventName);
    if(record.eventName === 'REMOVE') {
      await client.delete({
        id: record.dynamodb.Keys.id.S,
        index: 'messages'
      })
    } else {
      const body = {
        id: record.dynamodb.NewImage.id.S,
        message: record.dynamodb.NewImage.message.S,
        title: record.dynamodb.NewImage.title.S,
      };
      console.log('DOCUMENT : ', body);
      const id = record.dynamodb.NewImage.id.S;
      await client.index({
        index: 'messages',
        id,
        body
      })
    }
  }
  return `Successfully processed ${event.Records.length} records.`;
}