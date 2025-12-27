import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
  FieldSet
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";

const page = () => {
  return (
    <>
      <SiteHeader />
      <div className="flex flex-1 flex-col">
        <div className="@container/main flex flex-1 justify-between gap-2 p-4 md:gap-6 md:p-6 lg:flex-row">
          <div className="w-full">
            <div className="flex justify-between w-full">
              <h2 className="text-lg font-semibold mb-2">Add New Product</h2>
              <div className="">
                {/* save, publish buttons */}
                <Button variant="outline" className="mr-2">
                  Save Draft
                </Button>
                <Button>Publish Product</Button>
              </div>
            </div>
            <div className="mt-4 flex w-full">
              <div className="flex flex-col gap-4 w-2/3 mr-4">
                <Card className="py-4">
                  <CardContent>
                    <h2 className="text-lg font-semibold mb-2">
                      Product Details
                    </h2>
                    <FieldSet>
                      <FieldGroup>
                        <Field>
                          <FieldLabel>Name</FieldLabel>
                          <Input
                            placeholder="Enter product name"
                            className="h-8 w-full"
                          />
                        </Field>
                        <Field>
                          <FieldLabel>Product Code</FieldLabel>
                          <Input
                            placeholder="Enter product code"
                            className="h-8 w-full"
                          />
                        </Field>
                        <Field>
                          <FieldLabel>Description</FieldLabel>
                          <Textarea
                            placeholder="Enter product description"
                            className="h-8 w-full"
                          />
                        </Field>
                      </FieldGroup>
                    </FieldSet>
                  </CardContent>
                </Card>
                <Card className="py-4">
                  <CardContent>
                    <h2 className="text-lg font-semibold mb-2">
                      Product Images
                    </h2>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-gray-400 transition">
                      <p className="text-gray-600 mb-2">
                        Drag and drop images here
                      </p>
                      <p className="text-sm text-gray-500 mb-4">or</p>
                      <input
                        type="file"
                        multiple
                        accept="image/*"
                        className="hidden"
                        id="image-upload"
                      />
                      <label htmlFor="image-upload">
                        <Button variant="outline" className="cursor-pointer">
                          Select Images
                        </Button>
                      </label>
                    </div>
                  </CardContent>
                </Card>
                <Card className="py-4">
                  <CardContent>
                    <h2 className="text-lg font-semibold mb-2">Varients</h2>
                  </CardContent>
                  {/* option, price, stock */}
                </Card>
              </div>
              <div className="flex flex-col gap-4 w-1/3">
                <Card className="py-4">
                  <CardContent>
                    <h2 className="text-lg font-semibold mb-2">Price</h2>
                    <Field>
                      <FieldLabel>Price ($)</FieldLabel>
                      <Input
                        placeholder="Enter product price"
                        className="h-8 w-full"
                      />
                    </Field>
                    <Field className="mt-2">
                      <FieldLabel>Compare at Price ($)</FieldLabel>
                      <Input
                        placeholder="Enter compare at price"
                        className="h-8 w-full"
                      />
                    </Field>
                    {/* checkbox  */}
                    <div className="flex gap-2 items-center mt-2">
                      <Checkbox />
                      <span className="text-sm">
                        Charge taxes on this product
                      </span>
                    </div>
                    <FieldSeparator className="mt-2" />
                    <div className="flex items-center mt-2 gap-2">
                      <Switch />
                      <span className="ml-2 text-sm">In stock</span>
                    </div>
                  </CardContent>
                </Card>
                <Card className="py-4">
                  <CardContent>
                    <h2 className="text-lg font-semibold mb-2">Status</h2>
                    <Field>
                      <FieldLabel htmlFor="status-select">
                        Product Status
                      </FieldLabel>
                      <Select defaultValue="draft">
                        <SelectTrigger className="h-8" id="status-select">
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="draft">Draft</SelectItem>
                          <SelectItem value="published">Published</SelectItem>
                          <SelectItem value="archived">Archived</SelectItem>
                        </SelectContent>
                      </Select>
                    </Field>
                  </CardContent>
                </Card>
                <Card className="py-4">
                  <CardContent>
                    <h2 className="text-lg font-semibold mb-2">Categories</h2>
                    <Field>
                      <FieldLabel>Assign Categories</FieldLabel>
                      <Select>
                        <SelectTrigger className="h-8">
                          <SelectValue placeholder="Select categories" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="clothing">Clothing</SelectItem>
                          <SelectItem value="accessories">
                            Accessories
                          </SelectItem>
                          <SelectItem value="footwear">Footwear</SelectItem>
                          <SelectItem value="electronics">
                            Electronics
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </Field>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default page;
