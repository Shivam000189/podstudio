import { Request, Response } from "express";
import { registerUser, loginUser, getMe } from "../services/auth.service";
import { generateToken } from "../utils/jwt";
import { AuthRequest } from "../middleware/auth.middleware";



//Register
export const register = async (req: Request, res: Response) => {
  try {
    const { name, email, password } = req.body;

    const user = await registerUser(name, email, password);

    const token = generateToken(user.id);

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      data: {
        _id: user.id,
        name: user.name,
        email: user.email,
        token,
    },
  });
  } catch (error: any) {
    res.status(error.statusCode || error.status || 400).json({
      success: false,
      message: error.message,
    });
  }
};


//Login
export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    const user = await loginUser(email, password);
    const token = generateToken(user.id);

    res.json({
      success: true,
      token,
      expiresIn: "24h",
      user: {
        _id: user.id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (err: any) {
    res.status(err.statusCode || err.status || 400).json({
      success: false,
      message: err.message,
    });
  }
};


// Get me 
export const me = async (req:AuthRequest, res:Response) => {
  try{
    const user = await getMe(req.userId!);

    res.json({
      success:true,
      data:{
        _id:user?.id,
        name:user?.name,
        email:user?.email,
        createdAt: user?.created_at,
      },
    });
  }
  catch (err: any) {
  console.error(err);

  res.status(500).json({
    success: false,
    message: err.message,
    stack: err.stack,
  });
}

}

// Logout

export const logout = async (_req:Request, res:Response) => {
      res.json({
        success: true,
        message: "Logged out successfully",
      });
}
