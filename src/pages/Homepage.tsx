import { setTheme } from '../tools/themes'
import { tyiping } from '../tools/typed'
import { useEffect } from 'react'
import { Navbar } from './navbar';


export function Homepage() {

 

useEffect(() => {
  const typedInstance = tyiping();

  return () => {
    typedInstance.destroy(); // Cleanup on unmount
  };
}, []);
 
useEffect(() => {
  setTheme();
  const themeButton = document.querySelector('.theme-button');
  themeButton?.addEventListener('click', setTheme);

  return () => {
    themeButton?.removeEventListener('click', setTheme);
  };
}, []);

  
  return (
  <>
<Navbar/>


  <div className='header-container'>
    
  <h1 className='title-header'>
    Track your <span className="typer"> </span> 
  </h1>
  </div>
  <h2 className="description">
    Welcome to Finance Tracker! This application is designed to help you manage your finances effectively. With our user-friendly interface, you can easily track your income, expenses, and savings all in one place.
  </h2>
  </>
  )
}