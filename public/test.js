myString = "myFunction(p1, p2) {return p1*p2;}"
myOtherString = "myClass = {" + myString + "}"
console.log(myOtherString)
eval(myOtherString)
console.log(myClass.myFunction(2,3))