const multer=require('multer');
const path=require("path");
const crypto=require("crypto");


const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, './public/images/upload')
    },
    filename: function (req, file, cb) {
      const fn=crypto.randomBytes(12,function(err,name){
        name.toString("hex")+path.extname(file.originalname);
        cb(null, fn)
      })
      
    }
  })

 //export upload variable
  const upload = multer({ storage: storage })
   module.exports=upload;
