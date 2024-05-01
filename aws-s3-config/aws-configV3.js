const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");

const { v4: uuidv4 } = require("uuid");

const MIME_TYPES = {
  "image/jpg": "jpg",
  "image/jpeg": "jpg",
  "image/png": "png",
};

exports.awsConfigV3 = async (files) => {
  const client = new S3Client({});
  const arrayMainFileName = [];
  const filesName = [];
  if (files.mainFile) {
    const mainFileExtension = MIME_TYPES[files.mainFile[0].mimetype];
    const mainFileName = files.mainFile[0].originalname
      .split(" ")
      .join("_")
      .split(".");
    const newMainFileName = mainFileName + uuidv4() + "." + mainFileExtension;

    const mainFileParam = {
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: `upload/${newMainFileName}`,
      Body: files.mainFile[0].buffer,
      ContentType: files.mainFile[0].mimetype,
    };
    arrayMainFileName.push(newMainFileName);
    await client.send(new PutObjectCommand(mainFileParam));
  }
  if (files.files) {
    for (let i = 0; i < files.files.length; i++) {
      const extension = MIME_TYPES[files.files[i].mimetype];
      const fileName = files.files[i].originalname
        .split(" ")
        .join("_")
        .split(".");
      const newFileName = fileName + uuidv4() + "." + extension;

      const fileParam = {
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: `upload/${newFileName}`,
        Body: files.files[i].buffer,
        ContentType: files.files[i].mimetype,
      };

      filesName.push(newFileName);

      await client.send(new PutObjectCommand(fileParam));
    }
  }

  return { mainFileName: arrayMainFileName, filesName: filesName };
};
