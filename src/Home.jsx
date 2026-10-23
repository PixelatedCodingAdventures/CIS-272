import React from 'react';
import { useUser } from "./context/UserContext";


const Home = () => {
  const { user } = useUser();
  return (
    <div>
      <header>
        <h3>Welcome to Equipment Checkout</h3>
        
      </header>


{user && (
    <>
        <p>Logged in as: {user.name}</p>
        <p>Your role: {user.role}</p>
    </>
)}



    </div>
  );
};


export default Home;
