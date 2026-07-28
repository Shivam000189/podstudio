import jwt from "jsonwebtoken";


const JWT_SCRET = process.env.JWT_SECRET as string || 'shivam123';


if(!JWT_SCRET){
    throw new Error("JWT_SECRET not defined");
}

export const generateToken = (userId: string) => {
    return jwt.sign({userId}, JWT_SCRET,{
        expiresIn: "24h",
    })
};


export const verifyToken = (token:string)=> {
    return jwt.verify(token, JWT_SCRET) as {userId: string};
};





