import React from "react";
import {BrowserRouter, NavLink, Routes, Route} from "react-router-dom";
import {Counter} from "@nereid/webreactexample";

export const Frame = () => {
  return <BrowserRouter>
    <div id="frame">
      <h1>Example</h1>
      <nav>
        <NavLink to="/">Home</NavLink>
        <NavLink to="/test">Test</NavLink>
        <NavLink to="/counter">Counter</NavLink>
      </nav>
      <main>
        <span>xxx</span>
        <Routes>
          <Route path="*" element={<span>test</span>}/>
          <Route path="test" element={<span>test</span>}/>
          <Route path="counter" element={<Counter/>}/>
        </Routes>
        <Counter/>
      </main>
    </div>
  </BrowserRouter>
};
