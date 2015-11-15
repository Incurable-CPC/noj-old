var isValid = [];
function checkSubmit() {
  var submit = $("#submit");
  for (var name in isValid) {
    if (!isValid[name]) {
      submit.prop("disabled", true);
      return;
    }
  }
  submit.prop("disabled", false);
}
function errorFeedback(name, str) {
  var x = $("#"+name+"-warning");
  var p = x.parent();
  p.removeClass("has-success");
  p.addClass("has-error");
  x.text(str);
  isValid[name] = false;
  checkSubmit();
}
function validFeedback(name) {
  var x = $("#"+name+"-warning");
  var p = x.parent();
  p.removeClass("has-error");
  p.addClass("has-success");
  x.text("");
  isValid[name] = true;
  checkSubmit();
}
function checkConfirmPassword() {
  var password = $("#password").val();
  var confirmPassword = $("#confirm-password").val();
  if (password == confirmPassword) {
    validFeedback("confirm-password");
  } else {
    errorFeedback("confirm-password", "Passwords not match");
  }
}
$(document).ready(function() {
  $("#submit").attr("disabled", true);
  isValid['username'] = false;
  isValid['password'] = false;
  isValid['confirm-password'] = false;
  $("#username").keyup(function() {
    var username = $(this).val();
    if (username) {
      $.get("/reg/exist/"+username, function(data) {
        if (data.exist) {
          errorFeedback("username", "Username exist");
        } else {
          validFeedback("username");
        }
      }, "json");
    } else {
      errorFeedback("username", "Please input username");
    }
  });
  $("#password").keyup(function() {
    var password = $(this).val();
    if (password) {
      validFeedback("password");
    } else {
      errorFeedback("password", "Please input password");
    }
    checkConfirmPassword();
  });
  $("#confirm-password").keyup(checkConfirmPassword);
});
