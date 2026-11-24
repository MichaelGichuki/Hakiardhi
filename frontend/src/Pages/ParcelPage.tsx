import { Info, Search } from "lucide-react";
import { Card } from "../Components/Card";
import { PageHeading } from "../Components/PageHeading";
import { Badge } from "../Components/Badge";
import { VerifyRow } from "../Components/VerifyRow";
import { useEffect, useState } from "react";
import { parcelRecords } from "../service/parcels";
import type { ParcelDetailsDto, parcelDto } from "../types/parcels.type";
import { useDebounce } from "../app/hooks";
import { formatDate } from "../app/utils";

export function ParcelPage({
  query,
  setQuery,
  setSearched,
}: {
  query: string;
  setQuery: (v: string) => void;
  searched: boolean;
  setSearched: (v: boolean) => void;
}) {

  const [list, setList] = useState<parcelDto[]>()
  const debouncedSearch = useDebounce(query, 100);
   const [selected, setSelected] = useState<ParcelDetailsDto | undefined>()

   const getParcel = async (id: string) => {
    try{
      const res = await parcelRecords.getParcels(id);
      setSelected(res.data);
    } catch{

    }
   }


  const handlerSearch = async (search: string) => {
    setSelected(undefined);
    try{
      const res = await parcelRecords.searchParcels(search);
      setList(res.data);
    } catch{

    }
  }


  useEffect(() => {
    if (!debouncedSearch.trim()) return;
    handlerSearch(debouncedSearch)
  }, [debouncedSearch]);

  return (
    <>
      <PageHeading
        title="Parcel Search & Record View"
        subtitle="Search the land register and verify ledger integrity."
      />
      <Card className="section-gap">
        <label className="field-label">Parcel number / title reference</label>
        <div className="search-row">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && setSearched(true)}
            placeholder="e.g. KJD/LOI/4581"
          />
          <button className="btn primary" onClick={() => setSearched(true)}>
            <Search size={15} /> Search
          </button>
        </div>
        <small className="muted">
          Example: KJD/LOI/4581 · Synthetic demonstration data
        </small>
      </Card>
       {Boolean(selected) && (
        <div className="two-col section-gap">
          <Card>
            <div className="eyebrow">REGISTERED PARCEL</div>
            <h2 className="record-title">{selected?.parcelNumber}</h2>
            <div className="record-field">
              <span>Registered proprietor</span>
              <b>{selected?.ownerName}</b>
            </div>
            <div className="record-grid">
              <div>
                <span>Land size</span>
                <b>{selected?.size} Ha</b>
              </div>
              <div>
                <span>County</span>
                <b>{selected?.county}</b>
              </div>
              <div>
                <span>Registration date</span>
                <b>{selected?.registrationDate ? formatDate(selected?.registrationDate) : ""}</b>
              </div>
              <div>
                <span>Tenure</span>
                <b>{selected?.tenure}</b>
              </div>
            </div>
            <div className="tag-row">
              <Badge tone="green">Registered</Badge>
              <Badge tone="blue">Version 1</Badge>
            </div>
          </Card>
          <Card>
            <h3>Cryptographic Confidence</h3>
            <p className="muted">Record integrity verification checklist</p>
            <VerifyRow label="Database record available" result="Match" />
            <VerifyRow label="SHA-256 digest matches" result="Match" />
            <VerifyRow
              label="Blockchain transaction confirmed"
              result="Confirmed"
            />
            <VerifyRow label="Title version consistent" result="Match" />
            <div className="confidence">
              ✓ HIGH CONFIDENCE — No mismatch detected
            </div>
          </Card>
          <Card className="full-span">
            <h3>Ledger reference</h3>
            <div className="hash">
              SHA-256:
              {selected?.Sha}
            </div>
          </Card>
        </div>
      )}
      {(
        list?.length == 0 && (
          <Card className="section-gap">
            <b>No matching synthetic record found</b>
            <p className="muted">Try:  KJD/LOI/4581.</p>
          </Card>
        )
      )}
      {
        !Boolean(selected) &&
        list?.map((value: parcelDto) => (
          <Card className="section-gap">
            <p>
              <b>{value.parcelNumber}</b>
            </p>
            {/* <p className="muted">Try KJD/LOI/4581.</p> */}
            <span className="muted">{value.ownerName}</span>
            <span className="muted">County:</span>
            <span className="muted">{"\t"+ value.county}</span>
            <button style={{float: "right", border: "none", backgroundColor: "transparent"}}
              onClick={() => getParcel(value.parcelNumber)}
            >
              <Info size={18} />
            </button>
          </Card>
        ))
      }
    </>
  );
}
