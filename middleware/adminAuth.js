const isLogged = (req, res, next) => {
    try{
  if (req.session.admin_id) {
    
  } else {
    res.redirect("/admin");
  }
  next()
}catch(error){
console.log(error.message)
}
}

const notLogged = (req, res, next) => {
  if (req.session.admin_id) {
    // If admin_id exists, clear the session and redirect to the login page
    req.session.destroy();
    return res.redirect("/admin/login");
  } else {
    next();
  }
};
module.exports = { isLogged, notLogged };
