from typing import Any, Dict, List, Literal, Optional, Union
from typing import Literal, Union
import json
from typing_extensions import Annotated

from pydantic import BaseModel, Field, ValidationError
from pydantic import BaseModel

class BertArgs(BaseModel):
    pretrained_model_name_or_path: str = "dbmdz/bert-large-cased-finetuned-conll03-english"

class BertModel(BaseModel):
    args: BertArgs = Field(BertArgs())
    model_name: Literal['bert'] = 'bert'

class UmapArgs(BaseModel):
    n_neighbors: int = 15
    n_components: int = 2
    metric: str = "cosine"
    random_state: int = 42
    n_jobs: int = 1
class UmapModel(BaseModel):
    args: UmapArgs = Field(UmapArgs())
    model_name: Literal['umap'] = 'umap'

class DynamicUmapArgs(BaseModel):
    n_neighbors: int = 15
class DynamicUmapModel(BaseModel):
    args: DynamicUmapArgs = Field(DynamicUmapArgs())
    model_name: Literal['dynamic_umap'] = "dynamic_umap"

class HDBScanArgs(BaseModel):
    min_cluster_size: int = 2
    metric: str = "euclidean"
    cluster_selection_method: str = "eom"
class HDBScanModel(BaseModel):
    args: HDBScanArgs = Field(HDBScanArgs())
    model_name: Literal["hdbscan"] = "hdbscan"



class ConfigModel(BaseModel):
    name: str = "default"
    embedding_config: Union[BertModel] = Field(BertModel())
    reduction_config: Union[UmapModel, DynamicUmapModel] = Field(UmapModel(), discriminator='model_name')
    cluster_config: Union[HDBScanModel] = Field(HDBScanModel())
    default_limit: Optional[int] = None
    model_type: Literal["static", "dynamic"] = "static"



config = ConfigModel()

print(config.dict())

bert_config = BertModel()
print(bert_config.dict())