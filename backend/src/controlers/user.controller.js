import httpStatus from "http-status";
import { User } from "../models/user.model.js";
import { Meeting } from "../models/meeting.model.js";
import bcrypt from "bcrypt";
import crypto from "crypto";


// 🟢 LOGIN Controller
const login = async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: "Please provide all fields" });
  }

  try {
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(httpStatus.NOT_FOUND).json({ message: "User not found" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(httpStatus.UNAUTHORIZED).json({ message: "Invalid password" });
    }

    // generate random token
    const token = crypto.randomBytes(20).toString("hex");
    user.token = token;
    await user.save();

    return res.status(httpStatus.OK).json({
      message: "Login successful",
      token: token,
      user: {
        name: user.name,
        username: user.username,
      },
    });
  } catch (e) {
    return res
      .status(500)
      .json({ message: `Something went wrong: ${e.message}` });
  }
};

// 🟣 REGISTER Controller
const register = async (req, res) => {
  const { name, username, password } = req.body;

  if (!name || !username || !password) {
    return res.status(400).json({ message: "Please fill all fields" });
  }

  try {
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res
        .status(httpStatus.FOUND)
        .json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      name: name,
      username: username,
      password: hashedPassword,
    });

    await newUser.save();
    return res
      .status(httpStatus.CREATED)
      .json({ message: "User registered successfully" });
  } catch (e) {
    return res
      .status(500)
      .json({ message: `Something went wrong: ${e.message}` });
  }
};

const getUserHistory = async (req, res) => {
  try {
    const token = req.headers.authorization
      ? req.headers.authorization.split(" ")[1]
      : req.query.token; // fallback if query

    if (!token) return res.status(401).json({ message: "Token missing" });

    const user = await User.findOne({ token });
    if (!user) return res.status(404).json({ message: "User not found" });

    const meetings = await Meeting.find({ user_id: user.username });
    res.status(200).json(meetings);
  } catch (err) {
    console.error("GET HISTORY ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
};


const addToHistory = async (req, res) => {
    const { token, meeting_code } = req.body;

    try {
        const user = await User.findOne({ token: token });

        const newMeeting = new Meeting({
            user_id: user.username,
            meetingCode: meeting_code
        })

        await newMeeting.save();

        res.status(httpStatus.CREATED).json({ message: "Added code to history" })
    } catch (e) {
        res.json({ message: `Something went wrong ${e}` })
    }
}


export { login, register, getUserHistory, addToHistory }
