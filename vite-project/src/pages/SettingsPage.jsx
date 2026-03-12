import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { motion } from "framer-motion";
import { toast } from "sonner";

const SettingsPage = () => {
  return (
    <div className="page-container max-w-2xl">
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="page-header"
      >
        <h1 className="page-title">Settings</h1>
        <p className="page-description">Manage your HRMS preferences and configuration.</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="glass-card rounded-xl divide-y"
      >
        <div className="p-5 space-y-4">
          <h3 className="text-sm font-semibold">Organization</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Company Name</Label>
              <Input defaultValue="Acme Corp" />
            </div>
            <div className="space-y-2">
              <Label>Company Email</Label>
              <Input defaultValue="hr@acmecorp.com" />
            </div>
          </div>
        </div>

        <div className="p-5 space-y-4">
          <h3 className="text-sm font-semibold">Notifications</h3>
          <div className="space-y-3">
            {[
              { label: "Email on status change", description: "Notify candidate when their status changes" },
              { label: "New application alerts", description: "Get notified when a new candidate applies" },
              { label: "Offer letter reminders", description: "Remind to generate pending offer letters" },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">{item.label}</p>
                  <p className="text-xs text-muted-foreground">{item.description}</p>
                </div>
                <Switch defaultChecked />
              </div>
            ))}
          </div>
        </div>

        <div className="p-5">
          <Button onClick={() => toast.success("Settings saved!")}>Save Changes</Button>
        </div>
      </motion.div>
    </div>
  );
};

export default SettingsPage;
