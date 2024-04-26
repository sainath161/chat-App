import { useEffect, useRef, useState } from "react";
import "./Chat.css";
import EmojiPicker from "emoji-picker-react";
import {
  arrayUnion,
  doc,
  getDoc,
  onSnapshot,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { db } from "../../lib/firebase";
import { useChatStore } from "../../lib/chatStore";
import { useUserStore } from "../../lib/userStore";
import upload from "../../lib/upload";
import { toast } from "react-toastify";

const Chat = () => {
  const [chat, setChat] = useState();
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [img, setImg] = useState({
    file: null,
    url: "",
    bigImageIndex: null,
  });
  const [video, setVideo] = useState({
    file: null,
    url: "",
  });
  const [audioStream, setAudioStream] = useState(null);
  const [cameraStream, setCameraStream] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const recorderRef = useRef();
  const cameraRef = useRef();

  const { currentUser } = useUserStore();
  const { chatId, user, isCurrentUserBlocked, isReceiverBlocked } =
    useChatStore();

  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chat]);

  useEffect(() => {
    const unSub = onSnapshot(doc(db, "chats", chatId), (res) => {
      setChat(res.data());
    });
    return () => {
      unSub();
    };
  }, [chatId]);

  const handleEmoji = (e) => {
    setText((prev) => prev + e.emoji);
    setOpen(false);
  };

  const handleImg = (e, index) => {
    if (e.target.files[0]) {
      setImg({
        file: e.target.files[0],
        url: URL.createObjectURL(e.target.files[0]),
        bigImageIndex: index,
      });
    }
  };

  const handleVideo = (e) => {
    if (e.target.files[0]) {
      setVideo({
        file: e.target.files[0],
        url: URL.createObjectURL(e.target.files[0]),
      });
    }
  };

  const handleCameraCapture = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
      });
      setCameraStream(stream);
      cameraRef.current.srcObject = stream;
    } catch (error) {
      console.error("Error accessing camera:", error);
    }
  };

  const handleCapture = async () => {
    const canvas = document.createElement("canvas");
    canvas.width = cameraRef.current.videoWidth;
    canvas.height = cameraRef.current.videoHeight;
    canvas
      .getContext("2d")
      .drawImage(cameraRef.current, 0, 0, canvas.width, canvas.height);
    const imageUrl = canvas.toDataURL("image/png");
    const blob = await fetch(imageUrl).then((res) => res.blob());
    setImg({
      file: blob,
      url: imageUrl,
      bigImageIndex: null,
    });
    handleCameraCaptureStop();
  };

  const handleCameraCaptureStop = () => {
    cameraStream.getTracks().forEach((track) => track.stop());
    setCameraStream(null);
  };

  const handleAudioRecordStart = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });
      setAudioStream(stream);
      const mediaRecorder = new MediaRecorder(stream);
      const chunks = [];

      mediaRecorder.ondataavailable = (e) => {
        chunks.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        const blob = new Blob(chunks, { type: "audio/webm" });
        const audioURL = URL.createObjectURL(blob);

        const audioFile = new File([blob], "audio.webm", {
          type: "audio/webm",
        });

        setAudioStream(null);

        try {
          const audioUrl = await upload(audioFile);
          await updateDoc(doc(db, "chats", chatId), {
            messages: arrayUnion({
              senderId: currentUser.id,
              audio: audioUrl,
              text: "Recording",
              createdAt: new Date(),
            }),
          });
        } catch (error) {
          console.error("Error uploading audio:", error);
        }
      };

      mediaRecorder.start();
      recorderRef.current = mediaRecorder;
    } catch (error) {
      console.error("Error accessing microphone:", error);
    }
    setIsRecording(true);
  };

  const handleAudioRecordStop = () => {
    if (recorderRef.current) {
      recorderRef.current.stop();
      setAudioStream(null);
    }
    setIsRecording(false);
  };

  const handleRemoveBigImage = () => {
    setImg({
      ...img,
      bigImageIndex: null,
    });
  };

  const handleSend = async () => {
    if (text === "") return;

    let imgUrl = null;
    let videoUrl = null;

    try {
      if (img.file) {
        imgUrl = await upload(img.file);
      }
      if (video.file) {
        videoUrl = await upload(video.file);
      }
      await updateDoc(doc(db, "chats", chatId), {
        messages: arrayUnion({
          senderId: currentUser.id,
          text,
          createdAt: new Date(),
          ...(imgUrl && { img: imgUrl }),
          ...(videoUrl && { video: videoUrl }),
        }),
      });

      const userIDs = [currentUser.id, user.id];

      userIDs.forEach(async (id) => {
        const userChatsRef = doc(db, "userchats", id);
        const userChatSnapshot = await getDoc(userChatsRef);

        if (userChatSnapshot.exists()) {
          const userChatsData = userChatSnapshot.data();

          const chatIndex = userChatsData.chats.findIndex(
            (c) => c.chatId === chatId
          );
          userChatsData.chats[chatIndex].lastMessage = text;
          userChatsData.chats[chatIndex].isSeen =
            id === currentUser.id ? true : false;
          userChatsData.chats[chatIndex].updatedAt = Date.now();

          await updateDoc(userChatsRef, {
            chats: userChatsData.chats,
          });
        }
      });
    } catch (error) {
      toast.error("Error sending message", error);
    }

    setImg({
      file: null,
      url: "",
      bigImageIndex: null,
    });
    setVideo({
      file: null,
      url: "",
    });

    setText("");
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      handleSend();
    }
  };

  return (
    <div className="chat">
      <div className="top">
        <div className="user">
          <img src={user?.avatar || "./avatar.png"} alt="" />
          <div className="texts">
            <span>{user?.username}</span>
            <p>{user?.bio}</p>
          </div>
        </div>
        <div className="icons">
          <img src="./phone.png" alt="" />
          <img src="./video.png" alt="" />
          <img src="./info.png" alt="" />
        </div>
      </div>

      <div className="center">
        {chat?.messages?.map((message, index) => (
          <div
            className={
              message.senderId === currentUser?.id ? "message own" : "message"
            }
            key={message?.createdAt}
          >
            <div className="texts">
              {message.img && (
                <img
                  src={message.img}
                  alt=""
                  onClick={() =>
                    setImg({
                      ...img,
                      url: message.img,
                      bigImageIndex: index,
                    })
                  }
                  className={img.bigImageIndex === index ? "big" : ""}
                />
              )}
              {message.video && (
                <video src={message.video} controls width="250" height="150" />
              )}
              {message.audio && <audio src={message.audio} controls />}
              <p>{message.text}</p>
              <span className="timestamp">
                {new Date(message.createdAt?.toDate()).toLocaleString(
                  undefined,
                  {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                    hour: "numeric",
                    minute: "numeric",
                    hour12: true,
                  }
                )}
              </span>
            </div>
          </div>
        ))}
        {cameraStream && (
          <div className="message own">
            <div className="texts">
              <video
                ref={cameraRef}
                autoPlay
                controls
                width="100%"
                height="300"
              />
              <button onClick={handleCapture}>Capture</button>
            </div>
          </div>
        )}
        <div ref={endRef}></div>
      </div>

      <div className="bottom">
        <div className="icons">
          <label htmlFor="file">
            <img src="img.png" alt="" />
          </label>
          <input
            type="file"
            id="file"
            style={{ display: "none" }}
            onChange={handleImg}
          />
          <label htmlFor="video">
            <img src="video.png" alt="" />
          </label>
          <input
            type="file"
            className="video"
            id="video"
            accept="video/*"
            style={{ display: "none" }}
            onChange={handleVideo}
          />
          <img src="camera.png" alt="" onClick={handleCameraCapture} />
          <img
            src="mic.png"
            alt=""
            onMouseDown={handleAudioRecordStart}
            onMouseUp={handleAudioRecordStop}
            className={isRecording ? "active" : ""}
          />
        </div>
        <input
          type="text"
          placeholder={
            isCurrentUserBlocked || isReceiverBlocked
              ? "Ubblock to send a message"
              : "Type a message..."
          }
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyPress={handleKeyPress}
          disabled={isCurrentUserBlocked || isReceiverBlocked}
        />
        <div className="emoji">
          <img
            src="./emoji.png"
            alt=""
            onClick={() => setOpen((prev) => !prev)}
          />
          <div className="picker">
            <EmojiPicker open={open} onEmojiClick={handleEmoji} />
          </div>
        </div>
        <button
          className="sendButton"
          onClick={handleSend}
          disabled={isCurrentUserBlocked || isReceiverBlocked}
        >
          Send
        </button>
      </div>
      {img.bigImageIndex !== null && (
        <div className="big-image-container">
          <img src={img.url} alt="" className="big-image" />
          <button className="close-btn" onClick={handleRemoveBigImage}>
            X
          </button>
        </div>
      )}
    </div>
  );
};

export default Chat;
