import { Dices } from "lucide-react";
import { useState } from "react";
import { Button, Dialog } from "./ui";
import { GeneratedAvatar } from "./ui/generated-avatar";

export function AvatarPicker({
  name,
  onChoose,
}: {
  name: string;
  onChoose: (seed: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [variant, setVariant] = useState(0);
  const seed = `${name.trim().toLowerCase()}:${variant}`;

  return (
    <Dialog
      open={open}
      onOpenChange={setOpen}
      title="Выбрать аватар"
      description="Перемешивайте варианты, пока не найдёте подходящий."
      trigger={
        <Button type="button" size="sm" variant="outline">
          Выбрать аватар
        </Button>
      }
    >
      <div className="dialog-body nova-avatar-picker">
        <div
          className="nova-avatar-coin"
          key={seed}
          role="img"
          aria-label="Предпросмотр аватара"
        >
          <GeneratedAvatar seed={seed} />
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={() => setVariant((n) => n + 1)}
        >
          <Dices size={17} aria-hidden="true" /> Другой вариант
        </Button>
      </div>
      <div className="dialog-footer">
        <Button type="button" variant="outline" onClick={() => setOpen(false)}>
          Отмена
        </Button>
        <Button
          type="button"
          onClick={() => {
            onChoose(seed);
            setOpen(false);
          }}
        >
          Выбрать этот аватар
        </Button>
      </div>
    </Dialog>
  );
}
