import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function SettingsPage() {
  return (
    <DashboardLayout>
      <div className="flex flex-col space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        </div>
        
        <Tabs defaultValue="general" className="w-full">
          <TabsList>
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="position">Position</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="api">API</TabsTrigger>
          </TabsList>
          
          <TabsContent value="general">
            <Card>
              <CardHeader>
                <CardTitle>General Settings</CardTitle>
                <CardDescription>Manage your dashboard preferences</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Appearance</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="theme">Theme</Label>
                      <select id="theme" className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                        <option value="light">Light</option>
                        <option value="dark">Dark</option>
                        <option value="system">System</option>
                      </select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="currency">Display Currency</Label>
                      <select id="currency" className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                        <option value="usd">USD ($)</option>
                        <option value="eur">EUR (€)</option>
                        <option value="gbp">GBP (£)</option>
                      </select>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Dashboard</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="auto-refresh">Auto-refresh data</Label>
                        <p className="text-sm text-muted-foreground">
                          Automatically refresh dashboard data
                        </p>
                      </div>
                      <Switch id="auto-refresh" defaultChecked />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="show-tooltips">Show tooltips</Label>
                        <p className="text-sm text-muted-foreground">
                          Display explanatory tooltips on dashboard elements
                        </p>
                      </div>
                      <Switch id="show-tooltips" defaultChecked />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="refresh-interval">Refresh interval (seconds)</Label>
                      <Input id="refresh-interval" type="number" defaultValue="30" min="5" max="300" />
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button>Save Changes</Button>
              </CardFooter>
            </Card>
          </TabsContent>
          
          <TabsContent value="position">
            <Card>
              <CardHeader>
                <CardTitle>Position Settings</CardTitle>
                <CardDescription>Configure your liquidity position parameters</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Position Details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="position-address">Position Address</Label>
                      <Input id="position-address" defaultValue="HSwifErTLV5yiMrgmYfCGxPtwohekJX9CM4T6NJdzptU" readOnly />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="whirlpool-address">Whirlpool Address</Label>
                      <Input id="whirlpool-address" defaultValue="HJPjoWUrhoZzkNfRpHuieeFk9WcZWjwy6PBjZ81ngndJ" readOnly />
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Rebalancing Strategy</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="auto-rebalance">Automatic rebalancing</Label>
                        <p className="text-sm text-muted-foreground">
                          Automatically rebalance position when out of range
                        </p>
                      </div>
                      <Switch id="auto-rebalance" defaultChecked />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="rebalance-threshold">Rebalance threshold (%)</Label>
                        <Input id="rebalance-threshold" type="number" defaultValue="10" min="1" max="50" />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="rebalance-strategy">Rebalance strategy</Label>
                        <select id="rebalance-strategy" className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                          <option value="centered">Centered (around current price)</option>
                          <option value="trend-following">Trend following</option>
                          <option value="mean-reversion">Mean reversion</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Fee Management</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="auto-claim">Automatic fee claiming</Label>
                        <p className="text-sm text-muted-foreground">
                          Automatically claim fees when they reach a threshold
                        </p>
                      </div>
                      <Switch id="auto-claim" />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="claim-threshold">Fee claim threshold ($)</Label>
                      <Input id="claim-threshold" type="number" defaultValue="10" min="0.1" />
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button>Save Changes</Button>
              </CardFooter>
            </Card>
          </TabsContent>
          
          <TabsContent value="notifications">
            <Card>
              <CardHeader>
                <CardTitle>Notification Settings</CardTitle>
                <CardDescription>Configure alerts and notifications</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Email Notifications</h3>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">Email address</Label>
                      <Input id="email" type="email" placeholder="your@email.com" />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="email-enabled">Enable email notifications</Label>
                        <p className="text-sm text-muted-foreground">
                          Receive important alerts via email
                        </p>
                      </div>
                      <Switch id="email-enabled" />
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Notification Types</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="notify-position">Position status changes</Label>
                        <p className="text-sm text-muted-foreground">
                          When position moves in or out of range
                        </p>
                      </div>
                      <Switch id="notify-position" defaultChecked />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="notify-fees">Fee accrual</Label>
                        <p className="text-sm text-muted-foreground">
                          When significant fees are earned
                        </p>
                      </div>
                      <Switch id="notify-fees" defaultChecked />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="notify-rebalance">Rebalancing events</Label>
                        <p className="text-sm text-muted-foreground">
                          When position is rebalanced
                        </p>
                      </div>
                      <Switch id="notify-rebalance" defaultChecked />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="notify-price">Price alerts</Label>
                        <p className="text-sm text-muted-foreground">
                          When price moves significantly
                        </p>
                      </div>
                      <Switch id="notify-price" />
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button>Save Changes</Button>
              </CardFooter>
            </Card>
          </TabsContent>
          
          <TabsContent value="api">
            <Card>
              <CardHeader>
                <CardTitle>API Settings</CardTitle>
                <CardDescription>Manage API connections and keys</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Solana RPC</h3>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="rpc-url">RPC URL</Label>
                      <Input id="rpc-url" defaultValue="https://mainnet.helius-rpc.com/?api-key=58bf8ac6-817c-4236-b619-eed88a318452" />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="rpc-health-check">RPC health check</Label>
                        <p className="text-sm text-muted-foreground">
                          Periodically verify RPC connection
                        </p>
                      </div>
                      <Switch id="rpc-health-check" defaultChecked />
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">API Keys</h3>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="api-key">Dashboard API Key</Label>
                      <div className="flex space-x-2">
                        <Input id="api-key" type="password" value="••••••••••••••••••••••••••••••" readOnly />
                        <Button variant="outline">Regenerate</Button>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        Use this key to access the dashboard API programmatically
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Webhook Integration</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="webhook-enabled">Enable webhook notifications</Label>
                        <p className="text-sm text-muted-foreground">
                          Send events to external services
                        </p>
                      </div>
                      <Switch id="webhook-enabled" />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="webhook-url">Webhook URL</Label>
                      <Input id="webhook-url" placeholder="https://your-service.com/webhook" />
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button>Save Changes</Button>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
