(function ($) {
    function Tag() {
        var $this = this;

        function initilizeModel() {
            $("#modal-action-tag").on('loaded.bs.modal', function (e) {
                
            }).on('hidden.bs.modal', function (e) {
                
                $(this).removeData('bs.modal');
            });
        }
        $this.init = function () {
            initilizeModel();
        }
    }
    $(function () {
        var self = new Tag();
        self.init();
    })
}(jQuery))
