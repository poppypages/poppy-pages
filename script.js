const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzg5p1Yh7RhuhY8VEJyzgbBEQW73F5C8csxZqqIJ_DqWexlH44jkpjc-Vk_gTvYwPPY9g/exec';

document.addEventListener('DOMContentLoaded', () => {
    // 0. ADMIN SECURITY (Simple)
    if (window.location.pathname.includes('admin')) {
        const pass = prompt("Enter Admin Password:");
        if (pass !== "poppyadmin2026") {
            alert("Unauthorized");
            window.location.href = "index";
        }
    }

    // 1. LEAD FORM STEP 1 (Homepage)
    const formStep1 = document.getElementById('lead-form-step-1');
    if (formStep1) {
        formStep1.addEventListener('submit', async (e) => {
            e.preventDefault();
            const submitBtn = formStep1.querySelector('button');
            submitBtn.textContent = 'Processing...';
            submitBtn.disabled = true;

            const formData = new FormData(formStep1);
            const data = Object.fromEntries(formData.entries());

            // Save to LocalStorage for Step 2
            localStorage.setItem('poppypages_lead', JSON.stringify(data));

            // Initial submission to capture Name/Email immediately
            try {
                await submitToGoogle({ ...data, action: 'submitLead', partial: true });
            } catch (err) { console.error('Initial sub failed', err); }

            // Clean URL Redirect
            window.location.href = 'free-pack';
        });
    }

    // 2. MULTI-STEP AUDIT FORM (Step 2)
    const formStep2 = document.getElementById('lead-form-step-2');
    if (formStep2) {
        const steps = formStep2.querySelectorAll('.form-step');
        const nextBtn = document.getElementById('next-btn');
        const prevBtn = document.getElementById('prev-btn');
        const submitBtn = document.getElementById('submit-btn');
        const progressBar = document.getElementById('progress-bar');
        let currentStep = 0;

        const updateSteps = () => {
            steps.forEach((step, index) => {
                step.classList.toggle('active', index === currentStep);
            });

            // Nonlinear progress bar (Fast start, slower end)
            // Steps: 0, 1, 2, 3, 4, 5, 6
            const progressMap = [15, 35, 55, 70, 82, 92, 100];
            progressBar.style.width = `${progressMap[currentStep]}%`;

            // Buttons visibility
            prevBtn.style.display = currentStep === 0 ? 'none' : 'block';
            if (currentStep === steps.length - 1) {
                nextBtn.style.display = 'none';
                submitBtn.style.display = 'block';
            } else {
                nextBtn.style.display = 'block';
                submitBtn.style.display = 'none';
            }

            // Focus first input/select in step
            const firstInput = steps[currentStep].querySelector('input, select');
            if (firstInput) firstInput.focus();
        };

        const handleNext = async () => {
            // Validate current step
            const currentInputs = steps[currentStep].querySelectorAll('input, select');
            let valid = true;
            currentInputs.forEach(input => {
                if (input.required && !input.value) {
                    input.reportValidity();
                    valid = false;
                }
            });

            if (!valid) return;

            // Partial submission on every "Next" click
            const partialData = Object.fromEntries(new FormData(formStep2).entries());
            const step1Data = JSON.parse(localStorage.getItem('poppypages_lead') || '{}');
            await submitToGoogle({ ...step1Data, ...partialData, action: 'submitLead', partial: true, currentStep: currentStep + 1 });

            if (currentStep < steps.length - 1) {
                currentStep++;
                updateSteps();
            }
        };

        nextBtn.addEventListener('click', handleNext);
        prevBtn.addEventListener('click', () => {
            if (currentStep > 0) {
                currentStep--;
                updateSteps();
            }
        });

        // Enter key to go next
        formStep2.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                if (currentStep < steps.length - 1) {
                    handleNext();
                } else {
                    formStep2.requestSubmit();
                }
            }
        });

        // Final Submit
        formStep2.addEventListener('submit', async (e) => {
            e.preventDefault();
            submitBtn.textContent = 'Finishing Audit...';
            submitBtn.disabled = true;

            const finalData = Object.fromEntries(new FormData(formStep2).entries());
            const step1Data = JSON.parse(localStorage.getItem('poppypages_lead') || '{}');
            const payload = { ...step1Data, ...finalData, action: 'submitLead', partial: false };

            try {
                await submitToGoogle(payload);
                localStorage.removeItem('poppypages_lead');
                window.location.href = 'thank-u';
            } catch (error) {
                window.location.href = 'thank-u'; // Redirect anyway for UX
            }
        });

        updateSteps();
    }

    // 3. SMOOTH SCROLLING
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const targetId = this.getAttribute('href');

            // Prevent default if it's just a placeholder link
            if (targetId === '#') {
                e.preventDefault();
                return;
            }

            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                e.preventDefault();
                const headerOffset = 80;
                const elementPosition = targetElement.getBoundingClientRect().top;
                const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

                window.scrollTo({
                    top: offsetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });

    // 4. SUBMIT TO GOOGLE HELPER
    async function submitToGoogle(data) {
        const params = new URLSearchParams();
        for (const key in data) {
            params.append(key, data[key]);
        }
        params.append('timestamp', new Date().toISOString());

        return fetch(GOOGLE_SCRIPT_URL, {
            method: 'POST',
            mode: 'no-cors',
            body: params
        });
    }
});
