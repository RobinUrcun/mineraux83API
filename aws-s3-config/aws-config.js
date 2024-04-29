const aws = require("aws-sdk");
const S3 = new aws.S3();

const MIME_TYPES = {
  "image/jpg": "jpg",
  "image/jpeg": "jpg",
  "image/png": "png",
};

exports.awsConfig = async (files) => {
  // console.log(files);
  const promises = [];
  const extension = MIME_TYPES[files.mainFile[0].mimetype];

  // Traitez le fichier principal (mainFile)
  if (files.mainFile) {
    const mainFile = files.mainFile[0];
    const mainFileName = mainFile.originalname.split(" ").join("_");
    const mainParams = {
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: `upload/${Date.now() + mainFileName}`,
      Body: mainFile.buffer,
    };
    promises.push(S3.upload(mainParams).promise());
  }

  // Traitez les fichiers supplémentaires (files)
  if (files.files) {
    files.files.forEach((file) => {
      const fileName = file.originalname.split(" ").join("_");
      const params = {
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: `upload/${fileName + Date.now()}`,
        Body: file.buffer,
      };
      promises.push(S3.upload(params).promise());
    });
  }

  // Attendre que toutes les promesses soient résolues
  const promise = await Promise.all(promises);
  // console.log(promise);
  return promise;
};
