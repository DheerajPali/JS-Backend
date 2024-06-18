//HERE YOU CAN USE TRY-CATCH , OR PROMISE FOR THE SAME FILE

//APPROACH 1 - USING PROMISE
//asyncHandler is a high order func. check comment to know more about it.
const asyncHandler = (requestHandler) => {
  return (req, res, next) => {
    Promise.resolve(requestHandler(req, res, next)).catch((err) => next(err));
  };
};

export { asyncHandler };


/*

//APPROACH 2 - USING TYR-CATCH

//asyncHandler is a high order func. check comment to know more about it.
const asyncHandler1 = (fn) => async (req, res, next) => {
  try {
    await fn(req, res, next);
  } catch (error) {
    res.staus(err.code || 500).json({
      success: false,
      mesage: err.mesage,
    });
  }
};

*/


//High order function is a func. which can take a func. as parameter, and also can return a func.
/*
//HOW TO WRITE A HIGH ORDER FUNCTION ??

//just create an arrow func.
const asyncHandler = () => {} 

//take func as param. return an arrow func
const asyncHandler = (func) => {()=>{}} 
    
//just remore curly brackets {}
const asyncHandler = (fn) => () => {}
*/
