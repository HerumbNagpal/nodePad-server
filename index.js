const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const dotenv = require("dotenv").config();

//models
const User = require("./models/user");
const Stuff = require("./models/stuff");

const app = express();
app.use(express.json());
app.use(cors());

//connection to db
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then((result) => {
    app.listen(3001, () => {
      console.log("Server is up and running and connected to atlas!!");
    });
  })
  .catch((err) => {
    console.log(err);
  });

//routes
app.get("/", (req, res) => {
  res.send("HOLA AMIGAS!");
});
app.get("/users", (req, res) => {
  User.find({})
    .then((result) => {
      res.status(200).json(result);
    })
    .catch((err) => {
      res.status(400).json({ message: err.toString() });
    });
});

app.post("/signUp", async (req, res) => {
  const { username, email, password } = req.body;

  try {
    const existingUser = await User.findOne({ email: email });

    if (existingUser) {
      return res.status(409).json({ message: "Email already in use" });
    }

    const newUser = new User({
      username: username,
      email: email,
      password: password,
    });

    const userStuff = new Stuff({
      email: email,
      notes: [],
      todos: [],
    });

    await newUser.save();
    await userStuff.save();

    return res.status(200).json({
      data: {
        email: email,
      },
      statusCode: 200,
    });
  } catch (error) {
    console.error("Error during user registration:", error);
    return res
      .status(500)
      .json({ message: "An error occurred during user registration." });
  }
});

// app.post("/signUp", async (req, res) => {
//   const { username, email, password } = req.body;
//   await User.findOne({ email: email }).then((user) => {
//     if (user) {
//       // status(409)
//       return res.send({ message: "OLD EMAIL" });
//     } else {
//       const newUser = new User({
//         username: username,
//         email: email,
//         password: password,
//       });

//       newUser.save()
//         .then((result) => {
//           return res
//             .status(200)
//             .json({
//               data : {
//                 email : email
//               },
//               statusCode : 200
//             })
//             // .send({ message: "New user registered!", message: 200 });
//         })
//         .catch((error) => {
//           throw error;
//         });
//     }
//   });
// });

app.post("/login", (req, res) => {
  const { email, password } = req.body;
  User.findOne({ email: email })
    .then((user) => {
      if (user) {
        if (user.password == password) {
          return res.status(200).json({
            data: {
              email: email,
            },
            statusCode: 200,
          });
          // .send({message : 200});
        } else {
          // .status(401)
          return res.send({ message: "Password is incorrect!" });
        }
      } else {
        return (
          res
            // .status(404);
            .send({ message: "No user found, Please sign up" })
        );
      }
    })
    .catch((err) => {
      throw err;
    });
});

app.post("/findUser", (req, res) => {
  const { email } = req.body;
  User.findOne({ email: email })
    .then((data) => {
      return res.send(data.username).status(200);
    })
    .catch((err) => {
      throw err;
    });
});

app.post("/notes/findAll", async (req, res) => {
  const { email } = req.body;

  try {
    const userStuff = await Stuff.findOne({ email });

    if (!userStuff) {
      return res.json({ message: "User not found", statusCode: 404 });
    }
    const userNotes = userStuff.notes;
    return res.status(200).json({
      data: userNotes,
      statusCode: 200,
    });
  } catch (error) {
    throw error;
  }
});

app.post("/notes/add", async (req, res) => {
  const { email } = req.body;

  try {
    const userStuff = await Stuff.findOne({ email });

    if (!userStuff) {
      return res.status(404).json({ message: "User not found" });
    }

    const { title, content } = req.body;

    userStuff.notes.push({ title, content });

    await userStuff.save();

    res.status(201).json({
      message: "Note added successfully",
      note: userStuff.notes.slice(-1)[0],
      statusCode: 201,
    });
  } catch (error) {
    console.error("Error adding note:", error);
    res
      .status(500)
      .json({ message: "An error occurred while adding the note." });
  }
});

//working on delete
app.post("/notes/deleteNote", async (req, res) => {
  const { email, _id } = req.body;
  // console.log(email, _id);
  try {
    const userStuff = await Stuff.findOne({ email: email });

    if (!userStuff) {
      return res.status(404).json({ message: "User not found" });
    }

    const noteIndex = userStuff.notes.findIndex(
      (note) => note._id.toString() === _id
    );

    if (noteIndex === -1) {
      return res.status(404).json({ message: "Note not found" });
    }

    userStuff.notes.splice(noteIndex, 1);

    await userStuff.save();

    res
      .status(200)
      .json({ message: "Note deleted successfully", statusCode: 200 });
  } catch (error) {
    console.error("Error deleting note:", error);
    res
      .status(500)
      .json({ message: "An error occurred while deleting the note." });
  }
});

app.post("/notes/update", async (req, res) => {
  const { email, _id } = req.body;
  try {
    const userStuff = await Stuff.findOne({ email: email });
    if (!userStuff) {
      return res.status(404).json({ message: "User not found" });
    }
    let index = userStuff.notes.findIndex(
      (note) => note._id.toString() === _id
    );
    if (index === -1) {
      return res.status(404).json({ message: "Note not found" });
    }
    let updatedNote = { ...userStuff.notes[index], ...req.body };
    // console.log(updatedNote)
    userStuff.notes[index] = updatedNote;
    await userStuff.save();
    res.status(200).json({ message: "Updated Successfully", statusCode: 200 });
  } catch (error) {
    console.error("Error updatig note:", error);
    res
      .status(500)
      .json({ message: "An error occurred while updating the note." });
  }
});

app.post("/todos/findAll", async (req, res) => {
  const { email } = req.body;
  // console.log(email)
  try {
    const userStuff = await Stuff.findOne({ email });
    if (!userStuff) {
      return res.status(404).send("No User Found");
    }

    const userTodos = userStuff.todos;
    return res.status(200).json({ data: userTodos, statusCode: 200 });
  } catch (err) {
    console.log("Error fetching todo", err);
    res.status(500).send("Server Error");
  }
});

app.post("/todos/add", async (req, res) => {
  const { email } = req.body;

  try {
    const userStuff = await Stuff.findOne({ email });

    if (!userStuff) {
      return res.status(404).json({ message: "User not found" });
    }

    const { task, completed } = req.body;

    userStuff.todos.push({ task, completed });

    await userStuff.save();

    res.status(201).json({
      message: "task added successfully",
      todo: userStuff.todos.slice(-1)[0],
      statusCode: 201,
    });
  } catch (error) {
    console.error("Error adding task:", error);
    res
      .status(500)
      .json({ message: "An error occurred while adding the task." });
  }
});

app.post("/todos/completed", async (req, res) => {
  const { email } = req.body;
  try {
    const userStuff = await Stuff.findOne({ email });
    if (!userStuff) {
      return res.status(404).json({ message: "User Not Found" });
    }
    let todos = userStuff.todos;
    let i = 0;
    for (i; i < todos.length; i++) {
      if (todos[i]._id == req.body._id) {
        todos[i].completed = true;
        break;
      }
    }
    await userStuff.save();
    return res
      .status(200)
      .json({ message: "Task Completed", todo: todos[i], statusCode: 200 });
  } catch (err) {
    console.log("Error Marking Task as Complete: ", err);
    res.status(500).json({
      message: "An Error Occurred While Marking The Task As Complete",
    });
  }
});

app.post("/todos/del", async (req, res) => {
  const { email } = req.body;
  try {
    const userStuff = await Stuff.findOne({ email });
    if (!userStuff) {
      return res.status(404).json({ message: "User not found" });
    }
    let todos = userStuff.todos;
    let i = 0;
    for (i; i < todos.length; i++) {
      if (todos[i]._id == req.body._id) {
        todos.splice(i, 1);
        break;
      }
    }
    await userStuff.save();
    return res
      .status(200)
      .json({ message: "Deleted Successfully", statusCode: 200 });
  } catch (err) {
    console.log("Error Deleting Task: ", err);
    res
      .status(500)
      .json({ message: "An error occurred while deleting the task" });
  }
});