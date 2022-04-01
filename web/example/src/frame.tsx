import React from "react";
import {BrowserRouter, NavLink} from "react-router-dom";

export const Frame = () => {
  return <BrowserRouter>
    <div id="frame">
      <h1>Example</h1>
      <nav>
        <NavLink to="/">Home</NavLink> |{" "}
        <NavLink to="/test">Test</NavLink> |{" "}
        <NavLink to="/counter">Counter</NavLink>
      </nav>
    </div>
  </BrowserRouter>
};
