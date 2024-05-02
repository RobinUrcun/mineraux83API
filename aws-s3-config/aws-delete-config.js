const { DeleteObjectCommand, S3Client } = require("@aws-sdk/client-s3");

exports.awsDeleteConfig = async (mainFile, file) => {
  console.log(mainFile);
  const client = new S3Client({});
  if (mainFile) {
    for (let i = 0; i < mainFile.length; i++) {
      const mainFileParams = {
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: `upload/${mainFile[i]}`,
      };

      await client.send(new DeleteObjectCommand(mainFileParams));
    }
  }
  if (file) {
    console.log(file.length);
    for (let i = 0; i < file.length; i++) {
      const fileParams = {
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: `upload/${file[i]}`,
      };

      await client.send(new DeleteObjectCommand(fileParams));
    }
    return "supprimé";
  }
};
