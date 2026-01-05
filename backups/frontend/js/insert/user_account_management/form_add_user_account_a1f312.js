$(document).ready(function () {
  // Form submission
  $('#form_add_user_account_a1f312').on('submit', function (e) {
    e.preventDefault();

    const $form = $(this);
    const $btn  = $form.find('button[type="submit"]');

    $btn.prop('disabled', true).html('<i class="ri-loader-4-line spin"></i> Processing...');

    $.ajax({
      url: APP_API_ENDPOINT + '/insert/user_account_management/a1f312/users',
      type: 'POST',
      data: $form.serialize(),
      dataType: 'json',
      xhrFields: { withCredentials: true },
      success: function (res) {
        if (res.status !== 'success') {
          iziToast.error({ title: 'Error', message: res.message || 'Something went wrong.', position: 'topRight' });
          return;
        }
        iziToast.success({ title: 'Success', message: res.message, position: 'topRight' });
        $form[0].reset();
        $('#staticBackdrop-adduser-uc5xt3').modal('hide');
      },
      error: function (jqXHR) {
        iziToast.error({ title: 'AJAX Error', message: jqXHR.responseJSON?.message || 'Server error', position: 'topRight' });
      },
      complete: function () {
        $btn.prop('disabled', false).html('<i class="ri-save-2-fill me-2"></i> Save');
      }
    });
  });

});