import Typed from 'typed.js'

export function tyiping(){
 const type =  new Typed(".typer",{
      strings:["Spendings", "Savings"],
      typeSpeed:200,
      backSpeed:200,
      loop:true,
      showCursor:true
    });
    return type
}