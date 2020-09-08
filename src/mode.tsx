/*
 * @Author: Kanata You 
 * @Date: 2020-09-09 02:02:08 
 * @Last Modified by: Kanata You
 * @Last Modified time: 2020-09-09 03:33:26
 */
import React from "react";
import { render } from 'react-dom';
import { BilibiliFlv } from './BilibiliFlv';


const App = () => {

  return (
    <div className="App">
      <header className="App-header">
        <p>
          This is a demo.
        </p>
        <div
        style={{
          width: "calc(30vw + 200px)",
          margin: "0 auto"
        }} >
          <p>
            Video is free from <u>assets.mixkit.co</u>
          </p>
          <BilibiliFlv url={
            "https://assets.mixkit.co/videos/preview/mixkit-fireworks-illuminating-the-beach-sky-4157-large.mp4"
          } type="mp4" />
        </div>
      </header>
    </div>
  );
  
};

render(<App />, document.querySelector('#root'));
