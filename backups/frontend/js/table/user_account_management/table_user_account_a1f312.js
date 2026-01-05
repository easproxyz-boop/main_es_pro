$(document).ready(function () {
  function debounce(fn, delay = 400) {
    let timer;
    return function (...args) {
      clearTimeout(timer);
      timer = setTimeout(() => fn.apply(this, args), delay);
    };
  }

  const table = $('#table_user_account_a1f312').DataTable({
    serverSide: true,
    processing: true,
    deferRender: true,
    pageLength: 10,
    orderCellsTop: true,
    ajax: {
      url: APP_API_ENDPOINT + '/table/user_account_management/a1f312/users',
      type: 'POST',
      data: function(d) {
        d.showType = $('#select_latest_table_user_account_a1f312').val(); // ALL or LATEST
      },
      xhrFields: { withCredentials: true }
    },
    columns: [
      { data: null, orderable: false, searchable: false, render: (data, type, row, meta) => meta.row + meta.settings._iDisplayStart + 1 },
      { data: 'dt_date_added' },
      { data: 'dt_last_entry_by' },
      { data: 'dt_modification_type', className: 'text-center', render: data => {
          const badgeMap = { BASE: 'bg-success', EDITED: 'bg-warning text-dark', REMOVED: 'bg-danger' };
          return `<span class="badge ${badgeMap[data] || 'bg-secondary'}">${data}</span>`;
        }
      },
      { data: 'dt_current_status', className: 'text-center', render: data => {
          const badgeMap = { ACTIVE: 'bg-success', TOKEN: 'bg-warning text-dark', PROFILE: 'bg-warning text-dark', COMPLETED: 'bg-warning text-dark', BLOCKED: 'bg-danger' };
          return `<span class="badge ${badgeMap[data] || 'bg-secondary'}">${data}</span>`;
        }
      },
      { data: 'dt_google_info', orderable: false },
      { data: 'dt_user_token' },
      { data: 'dt_user_role' },
      { data: 'dt_access_attendance_system', className: 'text-center', render: data => `<span class="badge ${data === 'YES' ? 'bg-success' : 'bg-secondary'}">${data}</span>` },
      { data: 'dt_access_profile_information', className: 'text-center', render: data => `<span class="badge ${data === 'YES' ? 'bg-success' : 'bg-secondary'}">${data}</span>` },
      { data: 'dt_access_public_services', className: 'text-center', render: data => `<span class="badge ${data === 'YES' ? 'bg-success' : 'bg-secondary'}">${data}</span>` },
      { data: 'dt_access_office_department' },
      { data: 'dt_access_office_satellite_town' },
      { data: 'dt_access_office_satellite_brgy' },
      { data: 'action', orderable: false, searchable: false }
    ],
    order: [[1, 'desc']]
  });

  // Column search
  $('#table_user_account_a1f312 thead input').on('keyup change', debounce(function () {
    const colIndex = $(this).parent().index();
    table.column(colIndex).search(this.value).draw();
  }));

  // Reload table on dropdown change
  $('#select_latest_table_user_account_a1f312').on('change', function() {
    table.ajax.reload(null, false);
  });

  // Socket logic (optional)
  const socket = io(APP_API_ENDPOINT, { withCredentials: true });

  socket.emit('join_room_table_user_account_a1f312', 'table_user_account_a1f312');

  socket.on('refresh_table_user_account_a1f312', () => table.ajax.reload(null, false));

  window.addEventListener("beforeunload", () => { if (socket.connected) socket.disconnect(); });


  
});