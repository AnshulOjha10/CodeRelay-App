import React, { useEffect, useState } from "react";
import io from "socket.io-client";
import Editor from "@monaco-editor/react";
const socket = io("https://coderelay-server-production.up.railway.app/", {
  transports: ["websocket"],
});


function App() {
  const [Joined, setJoined] = useState(false);
  const [roomId, setRoomId] = useState("");
  const [userName, setUserName] = useState("");
  const [language, setlanguage] = useState("javascript");
  const [code, setcode] = useState("//Start coding here...");
  const [copySuccess, setCopySuccess] = useState("");
  const [users, setUsers] = useState([]);
  const [Typing, setTyping] = useState("");

  useEffect(() => {
    socket.on("userJoined", (users) => {
      setUsers(users);
    });

    socket.on("codeUpdate", (newCode) => {
      setcode(newCode);
    });

    socket.on("languageUpdate", (newLanguage) => {
      setlanguage(newLanguage);
    })

    socket.on("userTyping", (name) => {
      setTyping(`${name.slice(0, 8)}... is Typing`);
      setTimeout(() => {
        setTyping("");
      }, 2000);
    });

    return () => {
      socket.off("userJoined");
      socket.off("codeUpdate");
      socket.off("userTyping");
      socket.off("languageUpdate");
    };
  }, []);

  useEffect(() => {
    const handleBeforeUnload = () => {
      socket.emit("leaveRoom");
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, []);

  const handleLanguageChange = (e) => {
      const newLanguage = e.target.value;
      setlanguage(newLanguage);
      socket.emit("languageChange", { roomId, Language: newLanguage });
  }

  const leaveRoom = ()=>{
    socket.emit("leaveRoom");
    setJoined(false);
    setRoomId("");
    setUserName("");
    setcode("//Start coding here...");
    setlanguage("javascript");
  }

  const joinRoom = () => {
    socket.emit("join", { roomId, userName });
    setJoined(true);
  };

  const copyRoomId = () => {
    navigator.clipboard.writeText(roomId);
    setCopySuccess("Room ID copied to clipboard!");
    setTimeout(() => {
      setCopySuccess("");
    }, 2000);
  };

  const handleCodeChange = (newCode) => {
    setcode(newCode);
    socket.emit("codeChange", { roomId, code: newCode });
    socket.emit("typing", { roomId, userName });
  };

  if (!Joined) {
    return (
      <div className="text-white flex justify-center items-center h-screen ">
        <div className="p-10 border border-amber-100 rounded-4xl flex flex-col gap-2">
          <h1 className="text-6xl mb-3">Join Code Room</h1>
          <div className="text-red-500 text-sm">
            {" "}
            @ Please enter room code and your name to join
          </div>
          <div className="text-red-500 text-sm">
            {" "}
            @ If you don't have a room code, ask the host to share it with you.
          </div>
          <div className="text-red-500 text-sm">
            {" "}
            @ If you are the host, you can create a room and share the code with
            others.
          </div>
          <div className="text-red-500 text-sm">
            {" "}
            @ Note: Room code is case sensitive.
          </div>
          <div className="flex flex-col gap-2 mt-4">
            <input
              required
              className="border p-2 rounded-lg text-lg"
              type="text"
              name="room"
              placeholder="Enter room code"
              value={roomId}
              onChange={(e) => {
                setRoomId(e.target.value);
              }}
            />

            <input
              required
              className="border p-2 rounded-lg text-lg"
              type="text"
              name="userName"
              placeholder="Enter your name"
              value={userName}
              onChange={(e) => {
                setUserName(e.target.value);
              }}
            />

            <button
              onClick={joinRoom}
              className="border p-2 rounded-lg text-lg text-black hover: hover:bg-amber-400 hover:scale-105 duration-400 cursor-pointer font-black bg-[#FAFF00]"
            >
              Join Room
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="text-white flex h-screen">
      <div className="flex flex-col bg-[#011627] w-72 p-4 gap-6">
        <div className="space-y-2 justify-center items-center flex flex-col">
          <h2 className="text-xl font-semibold">Room Code: {roomId}</h2>
          <button
            onClick={copyRoomId}
            className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded text-sm"
          >
            Copy Id
          </button>
          {copySuccess && <span className="text-green-500">{copySuccess}</span>}
        </div>

        <div className="flex flex-col gap-2">
          <h3 className="text-lg font-medium">Users in Room:</h3>
          <ul className="flex flex-col gap-2">
            {users.map((user, index) => {
              return (
                <li key={index} className="bg-gray-600 px-3 py-1 rounded">
                  {user.slice(0, 8)}....
                </li>
              );
            })}
          </ul>
          <p className="text-sm italic text-gray-300">{Typing}</p>
        </div>

        <div className="flex flex-col gap-4">
          <select
            value={language}
            onChange={handleLanguageChange}
            className="bg-gray-700 text-white px-3 py-2 rounded"
          >
            <option value="javascript">Javascript</option>
            <option value="python">Python</option>
            <option value="java">Java</option>
            <option value="cpp">C++</option>
          </select>
          <button onClick={leaveRoom} className="bg-red-500 hover:bg-red-600 text-white font-semibold py-2 rounded">
            Leave Room
          </button>
        </div>
      </div>

      <div className="h-full w-full">
        <Editor
          height="100%"
          defaultLanguage={language}
          language={language}
          value={code}
          onChange={handleCodeChange}
          theme="vs-dark"
          options={{
            fontSize: 18,
            minimap: { enabled: false },
          }}
        />
      </div>
    </div>
  );
}

export default App;
