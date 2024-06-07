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