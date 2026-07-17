import { getTranslations } from "next-intl/server";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardBody } from "@/components/ui/Card";
import { NewBrandForm } from "@/components/brands/NewBrandForm";

export default async function NewBrandPage() {
  const t = await getTranslations("brands");

  return (
    <div className="mx-auto max-w-lg">
      <PageHeader title={t("createTitle")} subtitle={t("createSubtitle")} />
      <Card>
        <CardBody>
          <NewBrandForm />
        </CardBody>
      </Card>
    </div>
  );
}
