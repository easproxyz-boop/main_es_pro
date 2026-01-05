$(document).ready(function () {
$.ajax({
    url: APP_API_ENDPOINT + '/getdata/useraccount_management_users_offcanvas_menu_uuu8888',
    type: 'POST',
    dataType: 'json',
    xhrFields: {
        withCredentials: true
    },
    success: function (res) {

        const data = res?.data || {};
        let childPage_ATTENDANCE_SYSTEM = '';



        // =========================
        // ATTENDANCE SYSTEM ACCESS
        // =========================
        if ((data.dt_access_attendance_system || '').toUpperCase() === 'YES') {

            childPage_ATTENDANCE_SYSTEM = `
                <!-- ATTENDANCE SYSTEM DROPDOWN -->
                <a 
                    id="asidebari_at_attendance_system_dropdown"
                    class="asidebar-link-load-dropdown list-group-item list-group-item-action d-flex align-items-center fw-semibold rounded-3 mb-1 fs-5"
                    data-bs-toggle="collapse"
                    href="#collapseAttendanceSystem"
                    role="button"
                    aria-expanded="false"
                    aria-controls="collapseAttendanceSystem">
                    <i class="ri-government-line me-2"></i>
                    Human Resources
                    <i class="ri-arrow-down-s-line ms-auto"></i>
                </a>

                <!-- ATTENDANCE SUB MENU -->
                <div class="collapse ps-3" id="collapseAttendanceSystem">

                    <a href="/pages/maingeneral/menu/human_resources/employee_profile_info"
                       id="asidebari_at_employee_profile"
                       class="asidebar-link-load-000 list-group-item list-group-item-action fw-semibold border-0 rounded-3 mb-1">
                        <i class="ri-user-line me-2"></i> Employee Profile
                    </a>

                    <a href="/pages/attendance_system/at_logs"
                       class="asidebar-link-load-000 list-group-item list-group-item-action fw-semibold border-0 rounded-3 mb-1">
                        <i class="ri-time-line me-2"></i> Attendance Tracking
                    </a>

                    <a href="/pages/maingeneral/menu/human_resources/leave_and_requests"
                     id="asidebari_at_employee_leave_and_requests"
                       class="asidebar-link-load-000 list-group-item list-group-item-action fw-semibold border-0 rounded-3 mb-1">
                        <i class="ri-time-line me-2"></i> Leave & Requests
                    </a>



                    <a href="/pages/maingeneral/menu/human_resources/view_attendance_and_dtr"
                     id="asidebari_at_employee_view_attendance_and_dtr"
                       class="asidebar-link-load-000 list-group-item list-group-item-action fw-semibold border-0 rounded-3 mb-1">
                        <i class="ri-time-line me-2"></i> View attendance & DTR
                    </a>


                    <a href="/pages/maingeneral/menu/human_resources/payroll_integration"
                     id="asidebari_at_employee_payroll_integration"
                       class="asidebar-link-load-000 list-group-item list-group-item-action fw-semibold border-0 rounded-3 mb-1">
                        <i class="ri-time-line me-2"></i> Payroll Integration
                    </a>


                    <a href="/pages/attendance_system/at_reports"
                       class="asidebar-link-load-000 list-group-item list-group-item-action fw-semibold border-0 rounded-3 mb-1">
                        <i class="ri-file-chart-line me-2"></i> Reports
                    </a>

                </div>
            `;
        }

        // =========================
        // MAIN SIDEBAR CONTAINER
        // =========================
        const ContainerBody = `
            <div class="list-group list-group-flush p-2">

                <!-- HOME -->
                <a href="/pages/maingeneral/menu/home"
                   id="asidebari_home"
                   class="asidebar-link-load-000 list-group-item list-group-item-action d-flex align-items-center fw-semibold rounded-3 mb-1 fs-5">
                    <i class="ri-home-9-line me-2"></i> Home
                </a>


                <!-- REVIEW TIMELINE -->
                <a href="/pages/maingeneral/menu/review_timeline"
                   id="asidebari_review_timeline"
                   class="asidebar-link-load-000 list-group-item list-group-item-action d-flex align-items-center fw-semibold rounded-3 mb-1 fs-5">
                    <i class="ri-timeline-view me-2"></i> Review Timeline
                </a>






                <!-- PROFILE -->
                <a href="/pages/maingeneral/menu/profile_information"
                   id="asidebari_profile_information"
                   class="asidebar-link-load-000 list-group-item list-group-item-action d-flex align-items-center fw-semibold rounded-3 mb-1 fs-5">
                    <i class="ri-account-box-2-line me-2"></i> Profile Information
                </a>


                <!-- LOG IN AND OUT -->
                <a href="/pages/maingeneral/menu/qrcode_login_and_out"
                   id="asidebari_qrcode_login_and_out"
                   class="asidebar-link-load-000 list-group-item list-group-item-action d-flex align-items-center fw-semibold rounded-3 mb-1 fs-5">
                    <i class="ri-login-box-line me-2"></i> QR Code Login / Logout                
                </a>




                ${childPage_ATTENDANCE_SYSTEM}

            </div>
        `;

        $('#offcanvas-body-menu-8888s').html(ContainerBody);
    },
    error: function (xhr) {
        console.error('User access error:', xhr.responseText);
    }
});






























  function mainHome() {
  /* ===============================
     LOAD PAGE FUNCTION
  =============================== */
  function loadPage(page) {
    if (!page) return;
     $("#main-content-9999").load(page, function (response, status, xhr) {


      if (status === "success") {

        // Clear all active states
        $(".asidebar-link-load-dropdown, .asidebar-link-load-000,  .asidebar-link-load-111, .asidebar-link-load-222")
          .removeClass("active");

        // Set active link based on page
        switch (page) {
          case "/pages/maingeneral/menu/home":
            $("#asidebari_home").addClass("active");
            break;


          case "/pages/maingeneral/menu/review_timeline":
            $("#asidebari_review_timeline").addClass("active");
            break;


          case "/pages/maingeneral/menu/budget_allocation":
            $("#asidebari_budget_allocation").addClass("active");
            break;

          case "/pages/maingeneral/menu/fund_withdrawal":
            $("#asidebari_fund_withdrawal").addClass("active");
            break;
            


          // HUMAN RESOURCES

          case "/pages/maingeneral/menu/human_resources/employee_profile_info":
            $("#asidebari_at_attendance_system_dropdown").addClass("active");
            $("#asidebari_at_employee_profile").addClass("active");
            break;
          case "/pages/maingeneral/menu/human_resources/leave_and_requests":
            $("#asidebari_at_attendance_system_dropdown").addClass("active");
            $("#asidebari_at_employee_leave_and_requests").addClass("active");
            break;
          case "/pages/maingeneral/menu/human_resources/payroll_integration":
            $("#asidebari_at_attendance_system_dropdown").addClass("active");
            $("#asidebari_at_employee_payroll_integration").addClass("active");
            break;
          case "/pages/maingeneral/menu/human_resources/view_attendance_and_dtr":
            $("#asidebari_at_attendance_system_dropdown").addClass("active");
            $("#asidebari_at_employee_view_attendance_and_dtr").addClass("active");
            break;


            
          // HUMAN RESOURCES

            
          case "/pages/maingeneral/menu/profile_information":
            $("#asidebari_profile_information").addClass("active");
            break;

         case "/pages/maingeneral/menu/qrcode_login_and_out":
            $("#asidebari_qrcode_login_and_out").addClass("active");
            break;
            

          case "/pages/maingeneral/menu_settings/user_account_management/users":
            $("#settingSidebariUsrm_users").addClass("active");
            break;


          default:
            console.log("Page loaded:", page);
        }

      } else {
        console.error("❌ Load error:", xhr.status, xhr.statusText);
        $("#main-content-9999").html(
          "<p class='text-danger'>Failed to load content.</p>"
        );
      }
    });
  }
    loadPage("/pages/maingeneral/menu/home");

  /* ===============================
     SIDEBAR CLICK HANDLER
  =============================== */
  $(document).on("click", ".asidebar-link-load-000", function (e) {
    e.preventDefault();
    const page = $(this).attr("href");
    if (!page) return;
    loadPage(page);    
  });




  }
mainHome();
});
