$(document).ready(function () {
    const currentPath = window.location.pathname;
    let targetPage = '/main_'; // changed const to let

    $.ajax({
        url: APP_API_ENDPOINT + '/getdata/google_user_access',
        type: 'POST',
        dataType: 'json',
        xhrFields: {
            withCredentials: true
        },
        success: function (res) {
            const data = res.data || {};

            // If no Google email, redirect to sign-in
            if (!data.google_email) {
                if (currentPath !== '/sign-in') {
                    window.location.replace('/sign-in');
                }
                return;
            }


            // Populate user info
            $('.user-id').text(data.google_id || 'N/A');
            $('.user-email').text(data.google_email || 'N/A');
            $('.user-name').text(data.google_name || 'N/A');
            $('.user-picture').attr('src', data.google_picture || '');
            $('.user-access-role').text(data.access_role || '');

            // Determine target page based on current_status
            switch (data.current_status) {
                case 'TOKEN':
                    targetPage = '/getstarted/token';
                    break;
                case 'PROFILE':
                    targetPage = '/getstarted/profile';
                    break;
                case 'COMPLETED':
                    targetPage = '/getstarted/completed';
                    break;
                case 'BLOCKED':
                    targetPage = '/sign-in';
                    break;
                case 'ACTIVE':
                    targetPage = '/main';
                    break;
                default:
                    targetPage = '/sign-in';
                    break;
            }

            // Delay redirect by 1 second
            if (currentPath !== targetPage) {
                window.location.replace(targetPage);
            }



            // Initialize Socket.IO after verifying user
            const socket = io(APP_API_ENDPOINT, { withCredentials: true });
            const email_address = data.google_email.toUpperCase();

            // Join room ONCE only
            if (!window.emailRoomJoined) {
                socket.emit('join_email_room', email_address);
                window.emailRoomJoined = true;
                console.log('Joined email room:', email_address);
            }

            // Listen for updates
            socket.on('user_updated', (payload) => {
                console.log('User update received:', payload);
                location.reload();
            });



        },
        error: function (xhr) {
            console.error('Google info error:', xhr.responseText);
            if (currentPath !== '/sign-in') {
                window.location.replace('/sign-in');
            }
        }
    });
});
