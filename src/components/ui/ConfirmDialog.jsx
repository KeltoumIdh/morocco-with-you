import Icon from "../Icon";
import { ICONS } from "../../config/nav";
import Button from "./Button";
import Modal from "./Modal";

function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  message,
  danger = true,
}) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title=""
      size="sm"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant={danger ? "danger" : "primary"}
            onClick={() => {
              onConfirm?.();
              onClose?.();
            }}
          >
            {danger ? "Delete" : "Confirm"}
          </Button>
        </>
      }
    >
      <div className="flex flex-col items-center text-center py-4">
        <div
          className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 ${
            danger ? "bg-red-50" : "bg-blue-50"
          }`}
        >
          <Icon
            d={danger ? ICONS.trash : ICONS.check}
            size={22}
            className={danger ? "text-red-500" : "text-blue-500"}
          />
        </div>
        <h3 className="text-lg font-semibold text-slate-800 mb-2 syne">{title}</h3>
        <p className="text-sm text-slate-500">{message}</p>
      </div>
    </Modal>
  );
}

export default ConfirmDialog;

