import "./userInfo.css";
import { useUserStore } from "../../../lib/userStore";
import { useEffect, useState } from "react";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "../../../lib/firebase";
import upload from "../../../lib/upload";
import "./userInfo.css";

const UserInfo = () => {
  const { currentUser } = useUserStore();
  const [showModal, setShowModal] = useState(false);
  const [userDetails, setUserDetails] = useState({
    username: currentUser.username,
    bio: currentUser.bio,
    avatar: currentUser.avatar,
  });
  const [avatarFile, setAvatarFile] = useState(null);

  useEffect(() => {
    // Fetch user details from Firestore when the component mounts
    const fetchUserDetails = async () => {
      try {
        const userDocRef = doc(db, "users", currentUser.id);
        const userDocSnap = await getDoc(userDocRef);
        const userData = userDocSnap.data();
        if (userData) {
          setUserDetails({
            username: userData.username,
            bio: userData.bio,
            avatar: userData.avatar,
          });
        }
      } catch (error) {
        console.error("Error fetching user details:", error);
      }
    };

    fetchUserDetails();
  }, [currentUser.id]);

  // Function to handle edit button click and toggle modal visibility
  const handleEditClick = () => {
    setShowModal(true);
  };

  // Function to handle avatar file selection
  const handleAvatarChange = (e) => {
    if (e.target.files[0]) {
      setAvatarFile(e.target.files[0]);
    }
  };

  // Function to handle form submission and update user details in Firestore
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      let avatarUrl = userDetails.avatar;
      if (avatarFile) {
        avatarUrl = await upload(avatarFile);
      }
      const userDocRef = doc(db, "users", currentUser.id);
      await updateDoc(userDocRef, {
        username: userDetails.username,
        bio: userDetails.bio,
        avatar: avatarUrl,
      });
      // Update local user details after successful update
      currentUser.username = userDetails.username;
      currentUser.bio = userDetails.bio;
      currentUser.avatar = avatarUrl;
      setShowModal(false);
    } catch (error) {
      console.error("Error updating user details:", error);
    }
  };

  return (
    <div className="userInfo">
      <div className="user">
        <img src={currentUser.avatar || "./avatar.png"} alt="" />
        <div className="name">
          <h2>{currentUser.username}</h2>
          <p>{currentUser.bio}</p>
        </div>
      </div>
      <div className="icons">
        <img src="./more.png" alt="" />
        <img src="./video.png" alt="" />
        <img
          src="./edit.png"
          alt=""
          className="edit-icon"
          onClick={handleEditClick}
        />
      </div>
      {showModal && (
        <div className="modal">
          {/* Modal content goes here */}
          {/* For simplicity, you can render a basic form inside the modal */}
          <form onSubmit={handleSubmit}>
            <label htmlFor="username">Username:</label>
            <input
              type="text"
              id="username"
              value={userDetails.username}
              onChange={(e) =>
                setUserDetails({ ...userDetails, username: e.target.value })
              }
            />
            <label htmlFor="bio">Bio:</label>
            <textarea
              id="bio"
              value={userDetails.bio}
              onChange={(e) =>
                setUserDetails({ ...userDetails, bio: e.target.value })
              }
            />
            <label htmlFor="avatar">Avatar:</label>
            <input
              type="file"
              id="avatar"
              accept="image/*"
              onChange={handleAvatarChange}
            />
            <span className="button">
              <button type="submit">Save Changes</button>
              <button onClick={() => setShowModal(false)}>Cancel</button>
            </span>
          </form>
        </div>
      )}
    </div>
  );
};

export default UserInfo;
