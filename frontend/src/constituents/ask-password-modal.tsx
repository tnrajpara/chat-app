import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { type SetStateAction } from "react";

interface ModalState {
  password: string;
  setPassword: React.Dispatch<SetStateAction<string>>;
  isModalOpen: boolean;
  setIsModalOpen: React.Dispatch<SetStateAction<boolean>>;
  handleSubmit: () => void;
}

export const PasswordModal: React.FC<ModalState> = ({
  password,
  setPassword,
  isModalOpen,
  setIsModalOpen,
  handleSubmit,
}) => {
  return (
    <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Enter Room Password</DialogTitle>
          <DialogDescription>
            This room is private. Please enter the password to continue.
          </DialogDescription>
        </DialogHeader>

        <Input
          type="password"
          placeholder="Password"
          className="my-4"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <DialogFooter className="flex justify-between">
          <DialogClose asChild>
            <Button variant="outline">Close</Button>
          </DialogClose>
          <Button onClick={handleSubmit}>Submit</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
