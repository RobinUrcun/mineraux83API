const { DeleteObjectCommand, S3Client } = require("@aws-sdk/client-s3");

exports.awsDeleteConfig = async (mainFile, file) => {
  const client = new S3Client({});
  console.log("ok aws", mainFile);
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
    console.log("ok file");

    console.log(file);
    for (let i = 0; i < file.length; i++) {
      const fileParams = {
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: `upload/${file[i]}`,
      };

      await client.send(new DeleteObjectCommand(fileParams));
      console.log("ok");
    }
    return "supprimé";
  }
};
