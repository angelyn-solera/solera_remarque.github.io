 const users = JSON.parse(localStorage.getItem("users")) || [];

        // Email validation function
        function validateEmail(email) {
            const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            return re.test(String(email).toLowerCase());
        }

        // Validate username (alphanumeric with underscores)
        function validateUsername(username) {
            const re = /^[a-zA-Z0-9_]+$/;
            return re.test(username);
        }

        // Validate password (at least 6 characters)
        function validatePassword(password) {
            return password.length >= 6;
        }

        // Login Form Submission
        document.getElementById("loginForm").addEventListener("submit", function (e) {
            e.preventDefault();
            const username = document.getElementById("loginUsername").value;
            const password = document.getElementById("loginPassword").value;

            const user = users.find(
                (u) => u.username === username && u.password === password
            );

            if (user) {
                document.getElementById("loginMessage").textContent = "Login Successful!";
                document.getElementById("loginMessage").style.color = "green";
                // Redirect to another page or perform other actions
                setTimeout(() => {
                    window.location.href = "dashboard.html"; // Change to your actual dashboard page
                }, 1000);
            } else {
                document.getElementById("loginMessage").textContent =
                    "Invalid username or password.";
                document.getElementById("loginMessage").style.color = "red";
            }
        });

        // Sign Up Form Submission
        document.getElementById("signupForm").addEventListener("submit", function (e) {
            e.preventDefault();
            const username = document.getElementById("signupUsername").value;
            const email = document.getElementById("signupEmail").value;
            const password = document.getElementById("signupPassword").value;
            
            // Reset error messages
            document.getElementById("usernameError").textContent = "";
            document.getElementById("emailError").textContent = "";
            document.getElementById("passwordError").textContent = "";
            
            // Validate inputs
            let isValid = true;
            
            if (!validateUsername(username)) {
                document.getElementById("usernameError").textContent =
                    "Username can only contain letters, numbers, and underscores.";
                isValid = false;
            }
            
            if (!validateEmail(email)) {
                document.getElementById("emailError").textContent =
                    "Please enter a valid email address.";
                isValid = false;
            }
            
            if (!validatePassword(password)) {
                document.getElementById("passwordError").textContent =
                    "Password must be at least 6 characters long.";
                isValid = false;
            }
            
            if (!isValid) return;

            const userExists = users.some((u) => u.username === username);
            const emailExists = users.some((u) => u.email === email);

            if (userExists) {
                document.getElementById("usernameError").textContent =
                    "Username already exists.";
                isValid = false;
            }
            
            if (emailExists) {
                document.getElementById("emailError").textContent =
                    "Email already registered.";
                isValid = false;
            }
            
            if (!isValid) return;

            // If all validations pass
            users.push({ username, email, password });
            localStorage.setItem("users", JSON.stringify(users));
            document.getElementById("signupMessage").textContent =
                "Sign Up Successful! Please login.";
            document.getElementById("signupMessage").style.color = "green";
            
            // Clear form
            document.getElementById("signupUsername").value = "";
            document.getElementById("signupEmail").value = "";
            document.getElementById("signupPassword").value = "";
            
            // Switch back to login form after 2 seconds
            setTimeout(showLoginForm, 2000);
        });

        // Forgot Password Form Submission
        document.getElementById("forgotPasswordForm").addEventListener("submit", function (e) {
            e.preventDefault();
            const email = document.getElementById("forgotEmail").value;
            
            // Reset error message
            document.getElementById("forgotEmailError").textContent = "";
            
            if (!validateEmail(email)) {
                document.getElementById("forgotEmailError").textContent =
                    "Please enter a valid email address.";
                return;
            }

            const user = users.find((u) => u.email === email);

            if (user) {
                document.getElementById("forgotPasswordMessage").textContent =
                    "Password reset instructions sent to your email.";
                document.getElementById("forgotPasswordMessage").style.color = "green";
                document.getElementById("forgotEmail").value = "";
                
                // Switch back to login form after 3 seconds
                setTimeout(showLoginForm, 3000);
            } else {
                document.getElementById("forgotPasswordMessage").textContent =
                    "Email not found.";
                document.getElementById("forgotPasswordMessage").style.color = "red";
            }
        });

        // Show Sign Up Form
        function showSignUpForm() {
            document.getElementById("loginCard").style.display = "none";
            document.getElementById("signupCard").style.display = "block";
            document.getElementById("forgotPasswordCard").style.display = "none";
            
            // Reset messages
            document.getElementById("signupMessage").textContent = "";
            document.getElementById("usernameError").textContent = "";
            document.getElementById("emailError").textContent = "";
            document.getElementById("passwordError").textContent = "";
        }

        // Show Login Form
        function showLoginForm() {
            document.getElementById("loginCard").style.display = "block";
            document.getElementById("signupCard").style.display = "none";
            document.getElementById("forgotPasswordCard").style.display = "none";
            
            // Reset messages
            document.getElementById("loginMessage").textContent = "";
            document.getElementById("forgotPasswordMessage").textContent = "";
        }

        // Show Forgot Password Form
        function showForgotPassword() {
            document.getElementById("loginCard").style.display = "none";
            document.getElementById("signupCard").style.display = "none";
            document.getElementById("forgotPasswordCard").style.display = "block";
            
            // Reset messages
            document.getElementById("forgotPasswordMessage").textContent = "";
            document.getElementById("forgotEmailError").textContent = "";
        }

        // Toggle Dropdown Menu
        function toggleMenu() {
            const dropdownMenu = document.getElementById("dropdownMenu");
            dropdownMenu.classList.toggle("active");
        }
        
        // Real-time email validation for signup form
        document.getElementById("signupEmail").addEventListener("input", function() {
            const email = this.value;
            if (email && !validateEmail(email)) {
                document.getElementById("emailError").textContent = "Please enter a valid email address.";
            } else {
                document.getElementById("emailError").textContent = "";
            }
        });
        
        // Real-time username validation for signup form
        document.getElementById("signupUsername").addEventListener("input", function() {
            const username = this.value;
            if (username && !validateUsername(username)) {
                document.getElementById("usernameError").textContent = 
                    "Username can only contain letters, numbers, and underscores.";
            } else {
                document.getElementById("usernameError").textContent = "";
            }
        });
        
        // Real-time password validation for signup form
        document.getElementById("signupPassword").addEventListener("input", function() {
            const password = this.value;
            if (password && !validatePassword(password)) {
                document.getElementById("passwordError").textContent = 
                    "Password must be at least 6 characters long.";
            } else {
                document.getElementById("passwordError").textContent = "";
            }
        });