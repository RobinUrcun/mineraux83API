const { DeleteObjectCommand, S3Client } = require("@aws-sdk/client-s3");

exports.awsDeleteConfig = async (file) => {
  const client = new S3Client({});

  const params = { Bucket: process.env.AWS_BUCKET_NAME, Key: `upload/${file}` };

  await client.send(new DeleteObjectCommand(params));
  return "supprimé";
};
