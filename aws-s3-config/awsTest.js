const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");

const { v4: uuidv4 } = require("uuid");

const MIME_TYPES = {
  "image/jpg": "jpg",
  "image/jpeg": "jpg",
  "image/png": "png",
};

exports.awsConfigV3 = async (files) => {
  const client = new S3Client({});

  const promises = [];
  const extension = MIME_TYPES[files.mainFile[0].mimetype];
  const mainFileName = files.mainFile[0].originalname
    .split(" ")
    .join("_")
    .split(".");
  const newMainFileName = mainFileName[0] + uuidv4() + "." + extension;

  const param = {
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: `upload/${newMainFileName}`,
    Body: files.mainFile[0].buffer,
    ContentType: files.mainFile[0].mimetype,
  };
  const result = client.send(new PutObjectCommand(param));
  return newMainFileName;
};
