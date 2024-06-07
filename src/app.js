import express from "express"
import cors from "cors"
import cookieParser from "cookie-parser";

const app = express();

//here we're setting our origin for middleware.
app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials : true,
}))

//here we're setting limits to accept json. 
app.use(express.json({limit: "10kb"}))

//it will accept urls now. will fetch data from url after encoded it.
//  some websites use + instead of space but some web.uses %20 , so url type may be change, that's why we're using this to encode it.
app.use(express.urlencoded({extended:true, limit: "10kb"}))

//we're reffering to a folder("public") which holds static assets(data) , like image etc.
app.use(express.static("public"))

//it takes cookie , only server can read or modify or remove it.
//we can perform crud operation on it , for our security purpose.
app.use(cookieParser())


export {app}